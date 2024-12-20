import { IApproveTransactionInput } from '@nestwallet/app/common/types';
import { id } from '@nestwallet/app/common/utils/functions';
import { makeLoadable, onLoadable } from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { View } from '@nestwallet/app/components/view';
import { onBlockchain } from '@nestwallet/app/features/chain';
import {
  IBlockchainType,
  ITransactionProposal,
  ITransactionProposalType,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ApprovalWalletNotFoundScreen } from '@nestwallet/app/screens/approval/errors/wallet-not-found';
import { ApprovalEvmTransactionWithQuery } from '@nestwallet/app/screens/approval/transaction/evm/query';
import { ApprovalSvmTransactionWithQuery } from '@nestwallet/app/screens/approval/transaction/svm/query';
import { ApprovalTvmTransactionWithQuery } from '@nestwallet/app/screens/approval/transaction/tvm/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../../hooks/selected-wallet';
import { useSignerWallet } from '../../../../hooks/signer';
import { InternalTransactionApprovalStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  InternalTransactionApprovalStackParamList,
  'transaction'
>;

export const ApprovalTransactionWithData = withUserContext(
  _ApprovalTransactionWithData,
);

function _ApprovalTransactionWithData(props: RouteProps) {
  const { payload } = props.route.params;
  const { blockchain, walletAddress } = payload;
  const { wallets } = useUserContext();
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet();

  const selectedWallet = onBlockchain(blockchain)(
    () => selectedEvmWallet,
    () => selectedSvmWallet,
    () =>
      walletAddress
        ? makeLoadable(
            wallets.find((wallet) => wallet.address === walletAddress) ?? null,
          )
        : selectedTvmWallet,
  );

  return onLoadable(selectedWallet)(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => <ApprovalWalletNotFoundScreen blockchain={blockchain} />,
    (wallet) =>
      wallet ? (
        <ApprovalTransactionWithWallet
          wallet={wallet}
          transactionParams={payload}
          route={props}
        />
      ) : (
        <ApprovalWalletNotFoundScreen
          blockchain={blockchain}
          expectedAddress={onBlockchain(blockchain)(
            () => undefined,
            () => undefined,
            () => (walletAddress ? walletAddress : undefined),
          )}
        />
      ),
  );
}

interface ApprovalTransactionWithWalletProps {
  wallet: IWallet;
  transactionParams: IApproveTransactionInput;
  route: RouteProps;
}

function ApprovalTransactionWithWallet(
  props: ApprovalTransactionWithWalletProps,
) {
  const { transactionParams, wallet, route } = props;
  const { requestId, blockchain } = transactionParams;
  const { walletService, walletConnectProvider, tonConnectProvider } =
    useAppContext();
  const { wallets } = useUserContext();
  const signer = useSignerWallet(wallet);
  const walletConnect = route.route.params.payload.walletConnect;
  const tonConnectConnectionData =
    route.route.params.payload.tonConnectConnectionData;
  const dappData = {
    requestId,
    blockchain,
    walletConnect,
  };

  const navigation = route.navigation;
  const navigateBack = () => navigation.getParent()?.goBack();

  const handleCancel = async () => {
    if (walletConnect) {
      await walletConnectProvider.rejectRequest(walletConnect);
    } else if (tonConnectConnectionData) {
      await tonConnectProvider.postMessage(tonConnectConnectionData, {
        error: {
          code: 300,
          message: 'User declined the transaction',
        },
        id: requestId,
      });
    } else {
      await walletService.resolveApproval({
        ...dappData,
        blockchain,
        error: 'Transaction signature request rejected',
      });
    }
    navigateBack();
  };

  const handleEvmTransactionProposalCreated = async (
    proposal: ITransactionProposal,
  ) => {
    if (proposal.type === ITransactionProposalType.Safe) {
      navigation.replace('transactionProposal', {
        proposalId: proposal.id,
        walletId: wallet.id,
        dappData,
      });
    } else if (wallet.blockchain === IBlockchainType.Evm) {
      const txHash = proposal.ethKey!.txHash!;
      if (walletConnect) {
        await walletConnectProvider
          .confirmRequest(walletConnect, txHash)
          .catch(id);
      } else {
        await walletService
          .resolveApproval({
            ...dappData,
            blockchain,
            result: txHash,
          })
          .catch(id);
      }
    }
  };

  const handleSvmTransactionProposalCreated = async (
    proposals: ITransactionProposal[],
  ) => {
    const hashes = proposals.map((proposal) => proposal.svmKey!.txHash!);
    if (walletConnect) {
      await walletConnectProvider
        .confirmRequest(walletConnect, {
          signature: hashes[0]!,
        })
        .catch(id);
    } else {
      await walletService
        .resolveApproval({
          ...dappData,
          result: hashes,
        })
        .catch(id);
    }
  };

  const handleTvmTransactionProposalCreated = async (
    proposal: ITransactionProposal,
  ) => {
    if (tonConnectConnectionData) {
      await tonConnectProvider
        .postMessage(tonConnectConnectionData, {
          result: {
            result: proposal.tvmKey!.txHash!,
            id: '0',
          },
          id: requestId,
        })
        .catch(id);
    } else {
      await walletService
        .resolveApproval({
          ...dappData,
          blockchain: IBlockchainType.Tvm,
          result: {
            result: proposal.tvmKey!.txHash!,
            id: '0',
          },
        })
        .catch(id);
    }
  };

  return onBlockchain(wallet.blockchain)(
    () => (
      <ApprovalEvmTransactionWithQuery
        wallet={signer}
        wallets={wallets}
        transactionParams={transactionParams}
        connectionType={walletConnect ? 'wc' : 'injection'}
        client={walletService}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onTransactionProposalCreated={handleEvmTransactionProposalCreated}
      />
    ),
    () => (
      <ApprovalSvmTransactionWithQuery
        wallet={signer}
        wallets={wallets}
        transactionParams={transactionParams}
        connectionType={walletConnect ? 'wc' : 'injection'}
        client={walletService}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onTransactionProposalCreated={handleSvmTransactionProposalCreated}
      />
    ),
    () => (
      <ApprovalTvmTransactionWithQuery
        wallet={signer}
        wallets={wallets}
        transactionParams={transactionParams}
        connectionType={tonConnectConnectionData ? 'tc' : 'injection'}
        client={walletService}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onTransactionProposalCreated={handleTvmTransactionProposalCreated}
      />
    ),
  );
}
