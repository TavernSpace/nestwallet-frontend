import { useReplaceTo } from '@nestwallet/app/common/hooks/navigation';
import { IApproveTransactionInput } from '@nestwallet/app/common/types';
import { empty } from '@nestwallet/app/common/utils/functions';
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
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { decodePayload } from '../../../../common/navigation/utils';
import { useGoBackOrClose } from '../../../hooks/navigation';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { useSignerWallet } from '../../../hooks/signer';
import { useInternalApprovalModalStackNavigationOptions } from '../../../navigation/navigators/options';
import { ApprovalStackParamList } from '../../../navigation/types';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type TransactionRouteParams = IApproveTransactionInput;

type RouteProps = StackScreenProps<ApprovalStackParamList, 'transaction'>;

export const ApprovalTransactionWithData = withUserContext(
  _ApprovalTransactionWithData,
);

function _ApprovalTransactionWithData({ route }: RouteProps) {
  const { payload, isInternal = false } = route.params;
  const decodedPayload = decodePayload<TransactionRouteParams>(payload);
  const { blockchain, walletAddress } = decodedPayload;
  const { wallets } = useUserContext();
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet();

  useInternalApprovalModalStackNavigationOptions(
    decodedPayload,
    'Transaction signature request rejected',
  );

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
          transactionParams={decodedPayload}
          isInternal={isInternal}
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
  isInternal?: boolean;
}

function ApprovalTransactionWithWallet(
  props: ApprovalTransactionWithWalletProps,
) {
  const { transactionParams, wallet, isInternal = false } = props;
  const { requestId, tabId, blockchain } = transactionParams;
  const { wallets } = useUserContext();
  const { client } = useLockContext();
  const signer = useSignerWallet(wallet);
  const replaceTo = useReplaceTo();
  const navigation = useNavigation();
  const navigateBack = useGoBackOrClose(isInternal);
  const dappData = {
    requestId,
    tabId,
    isInternal,
  };

  const handleCancel = async () => {
    await client.resolveApproval({
      requestId: requestId,
      tabId,
      blockchain,
      error: 'Transaction signature request rejected',
    });
    navigateBack();
  };

  const handleEvmTransactionProposalCreated = async (
    proposal: ITransactionProposal,
  ) => {
    if (proposal.type === ITransactionProposalType.Safe) {
      const params = {
        proposalId: proposal.id,
        walletId: wallet.id,
        dappData,
      };
      if (isInternal) {
        navigation.navigate('app', {
          screen: 'internalTransactionApproval',
          params: {
            screen: 'transactionProposal',
            params,
          },
        });
      } else {
        replaceTo('app', {
          screen: 'transactionProposal',
          params,
        });
      }
    } else if (wallet.blockchain === IBlockchainType.Evm) {
      const txHash = proposal.ethKey!.txHash!;
      await client
        .resolveApproval({
          ...dappData,
          blockchain,
          result: txHash,
        })
        .catch(empty);
    }
  };

  const handleSvmTransactionProposalCreated = async (
    proposals: ITransactionProposal[],
  ) => {
    const hashes = proposals.map((proposal) => proposal.svmKey!.txHash!);
    await client
      .resolveApproval({
        ...dappData,
        blockchain: IBlockchainType.Svm,
        result: hashes,
      })
      .catch(empty);
  };

  const handleTvmTransactionProposalCreated = async (
    proposal: ITransactionProposal,
  ) => {
    await client
      .resolveApproval({
        ...dappData,
        blockchain: IBlockchainType.Tvm,
        result: {
          result: proposal.tvmKey!.txHash!,
          id: '0',
        },
      })
      .catch(empty);
  };

  return onBlockchain(wallet.blockchain)(
    () => (
      <ApprovalEvmTransactionWithQuery
        wallet={signer}
        wallets={wallets}
        transactionParams={transactionParams}
        client={client}
        connectionType='injection'
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
        connectionType='injection'
        client={client}
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
        connectionType='injection'
        client={client}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onTransactionProposalCreated={handleTvmTransactionProposalCreated}
      />
    ),
  );
}
