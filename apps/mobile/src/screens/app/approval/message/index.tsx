import { IApproveMessageInput } from '@nestwallet/app/common/types';
import { id } from '@nestwallet/app/common/utils/functions';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { View } from '@nestwallet/app/components/view';
import { ChainId, onBlockchain } from '@nestwallet/app/features/chain';
import {
  IBlockchainType,
  IMessageProposal,
  IMessageProposalType,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ApprovalWalletNotFoundScreen } from '@nestwallet/app/screens/approval/errors/wallet-not-found';
import { ApprovalEvmMessageWithQuery } from '@nestwallet/app/screens/approval/message/evm/query';
import { ApprovalSvmMessageWithQuery } from '@nestwallet/app/screens/approval/message/svm/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../../hooks/selected-wallet';
import { useSignerWallet } from '../../../../hooks/signer';
import { InternalMessageApprovalStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  InternalMessageApprovalStackParamList,
  'message'
>;

export const ApprovalMessageWithData = withUserContext(
  _ApprovalMessageWithData,
);

function _ApprovalMessageWithData(props: RouteProps) {
  const { payload } = props.route.params;
  const { blockchain, chainId } = payload;
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet();

  const selectedWallet = onBlockchain(blockchain)(
    () => selectedEvmWallet,
    () => selectedSvmWallet,
    () => selectedTvmWallet,
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
        <ApproveMessageWithWallet
          wallet={wallet}
          chainId={chainId}
          messageParams={payload}
          route={props}
        />
      ) : (
        <ApprovalWalletNotFoundScreen blockchain={blockchain} />
      ),
  );
}

interface ApprovalMessageWithWalletProps {
  messageParams: IApproveMessageInput;
  wallet: IWallet;
  chainId: ChainId;
  route: RouteProps;
}

function ApproveMessageWithWallet(props: ApprovalMessageWithWalletProps) {
  const { messageParams, wallet, chainId, route } = props;
  const { requestId, blockchain } = messageParams;
  const { walletService, walletConnectProvider } = useAppContext();
  const signer = useSignerWallet(wallet);
  const walletConnect = route.route.params.payload.walletConnect;
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
    } else {
      await walletService.resolveApproval({
        ...dappData,
        blockchain,
        error: 'Message signature request rejected',
      });
    }
    navigateBack();
  };

  const handleMessageProposalCreated = async (proposal: IMessageProposal) => {
    if (proposal.type === IMessageProposalType.Safe) {
      navigation.replace('messageProposal', {
        messageId: proposal.id,
        walletId: wallet.id,
        dappData,
      });
    } else if (wallet.blockchain === IBlockchainType.Evm) {
      if (walletConnect) {
        await walletConnectProvider
          .confirmRequest(walletConnect, proposal.ethKey!.signature!)
          .catch(id);
      } else {
        await walletService
          .resolveApproval({
            ...dappData,
            blockchain,
            result: proposal.ethKey!.signature!,
          })
          .catch(id);
      }
    } else if (wallet.blockchain === IBlockchainType.Svm) {
      if (walletConnect) {
        await walletConnectProvider
          .confirmRequest(walletConnect, {
            signature: proposal.svmKey!.signature,
          })
          .catch(id);
      } else {
        await walletService
          .resolveApproval({
            ...dappData,
            blockchain,
            result: proposal.svmKey!.signature!,
          })
          .catch(id);
      }
    }
  };

  return onBlockchain(wallet.blockchain)(
    () => (
      <ApprovalEvmMessageWithQuery
        chainId={chainId}
        messageParams={messageParams}
        connectionType={walletConnect ? 'wc' : 'injection'}
        wallet={signer}
        client={walletService}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onMessageProposalCreated={handleMessageProposalCreated}
      />
    ),
    () => (
      <ApprovalSvmMessageWithQuery
        chainId={chainId}
        messageParams={messageParams}
        connectionType={walletConnect ? 'wc' : 'injection'}
        wallet={signer}
        client={walletService}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onMessageProposalCreated={handleMessageProposalCreated}
      />
    ),
    // TODO: add TON support
    () => null,
  );
}
