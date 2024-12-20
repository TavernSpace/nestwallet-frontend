import { safeMessageProposalCompletedSignature } from '@nestwallet/app/features/safe/utils';
import {
  IBlockchainType,
  ISafeMessageProposal,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { SafeMessageProposal } from '@nestwallet/app/screens/proposal/safe/message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../../../navigation/types';
import { useAppContext } from '../../../../../provider/application';
import { useUserContext } from '../../../../../provider/user';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'messageProposal'>;

export function SafeMessageProposalWithData({ route }: RouteProps) {
  const { dappData } = route.params;
  const { walletService, walletConnectProvider } = useAppContext();
  const { signers } = useUserContext();
  const navigation = useNavigation();

  const handleDeleted = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('app', {
        screen: 'walletDetails',
      });
    }
  };

  const handleApprove = async (message: ISafeMessageProposal) => {
    if (!dappData) return;
    if (dappData.walletConnect) {
      await walletConnectProvider.confirmRequest(
        dappData.walletConnect,
        safeMessageProposalCompletedSignature(message),
      );
    } else {
      await walletService.resolveApproval({
        requestId: dappData.requestId,
        tabId: dappData.tabId,
        blockchain: IBlockchainType.Evm,
        result: safeMessageProposalCompletedSignature(message),
      });
    }
  };

  const handleReject = async () => {
    if (!dappData) return;
    if (dappData.walletConnect) {
      await walletConnectProvider.rejectRequest(dappData.walletConnect);
    } else {
      await walletService.resolveApproval({
        requestId: dappData.requestId,
        tabId: dappData.tabId,
        blockchain: IBlockchainType.Evm,
        error: 'Message sign rejected',
      });
    }
    navigation.goBack();
  };

  return (
    <SafeMessageProposal
      dappData={dappData}
      signers={signers}
      walletService={walletService}
      onApprove={handleApprove}
      onReject={handleReject}
      onClose={navigation.goBack}
      onDeleted={handleDeleted}
    />
  );
}
