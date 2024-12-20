import { useReplaceTo } from '@nestwallet/app/common/hooks/navigation';
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
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { decodePayload } from '../../../../common/navigation/utils';
import { useGoBackOrClose } from '../../../hooks/navigation';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { useSignerWallet } from '../../../hooks/signer';
import { useInternalApprovalModalStackNavigationOptions } from '../../../navigation/navigators/options';
import { ApprovalStackParamList } from '../../../navigation/types';
import { useLockContext } from '../../../provider/lock';
import { withUserContext } from '../../../provider/user/wrapper';

type MessageRouteParams = IApproveMessageInput;

type RouteProps = StackScreenProps<ApprovalStackParamList, 'message'>;

export const ApprovalMessageWithData = withUserContext(
  _ApprovalMessageWithData,
);

function _ApprovalMessageWithData({ route }: RouteProps) {
  const { payload, isInternal = false } = route.params;
  const decodedPayload = decodePayload<MessageRouteParams>(payload);
  const { blockchain, chainId } = decodedPayload;
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet(); // TODO: We should probably get the wallet from the payload

  useInternalApprovalModalStackNavigationOptions(
    decodedPayload,
    'Message signature request rejected',
  );

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
          messageParams={decodedPayload}
          isInternal={isInternal}
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
  isInternal: boolean;
}

function ApproveMessageWithWallet(props: ApprovalMessageWithWalletProps) {
  const { messageParams, wallet, chainId, isInternal } = props;
  const { requestId, tabId, blockchain } = messageParams;
  const { client } = useLockContext();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();
  const replaceTo = useReplaceTo();
  const navigateBack = useGoBackOrClose(isInternal);
  const dappData = {
    requestId,
    tabId,
    isInternal,
  };

  const handleCancel = async () => {
    await client.resolveApproval({
      requestId,
      tabId,
      blockchain,
      error: 'Message signature request rejected',
    });
    navigateBack();
  };

  const handleMessageProposalCreated = async (proposal: IMessageProposal) => {
    if (proposal.type === IMessageProposalType.Safe) {
      if (isInternal) {
        navigation.navigate('app', {
          screen: 'internalMessageApproval',
          params: {
            screen: 'messageProposal',
            params: {
              messageId: proposal.id,
              walletId: wallet.id,
              dappData,
            },
          },
        });
      } else {
        replaceTo('app', {
          screen: 'messageProposal',
          params: {
            messageId: proposal.id,
            walletId: wallet.id,
            dappData,
          },
        });
      }
    } else if (wallet.blockchain === IBlockchainType.Evm) {
      await client
        .resolveApproval({
          ...dappData,
          blockchain: IBlockchainType.Evm,
          result: proposal.ethKey!.signature!,
        })
        .catch(id);
    } else if (wallet.blockchain === IBlockchainType.Svm) {
      await client
        .resolveApproval({
          ...dappData,
          blockchain: IBlockchainType.Svm,
          result: proposal.svmKey!.signature!,
        })
        .catch(id);
    }
  };

  return onBlockchain(wallet.blockchain)(
    () => (
      <ApprovalEvmMessageWithQuery
        chainId={chainId}
        messageParams={messageParams}
        connectionType='injection'
        wallet={signer}
        client={client}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onMessageProposalCreated={handleMessageProposalCreated}
      />
    ),
    () => (
      <ApprovalSvmMessageWithQuery
        chainId={chainId}
        messageParams={messageParams}
        connectionType='injection'
        wallet={signer}
        client={client}
        onCancel={handleCancel}
        onCompleted={navigateBack}
        onMessageProposalCreated={handleMessageProposalCreated}
      />
    ),
    // TODO: add TON support
    () => null,
  );
}
