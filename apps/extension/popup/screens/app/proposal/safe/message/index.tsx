import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { SafeMessageProposal } from '@nestwallet/app/screens/proposal/safe/message';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useGoBackOrClose } from '../../../../../hooks/navigation';
import { useInternalTransactionApprovalModalStackNavigationOptions } from '../../../../../navigation/navigators/options';
import { AppStackParamList } from '../../../../../navigation/types';
import { useLockContext } from '../../../../../provider/lock';
import { useUserContext } from '../../../../../provider/user';
import { openTrezorRequestString } from '../../utils';

type RouteProps = StackScreenProps<AppStackParamList, 'messageProposal'>;

export function SafeMessageProposalWithData({ route }: RouteProps) {
  const { dappData } = route.params;
  const { windowType } = useNestWallet();
  const { signers } = useUserContext();
  const { client } = useLockContext();
  const navigation = useNavigation();
  const navigateBack = useGoBackOrClose(!dappData || !!dappData.isInternal);

  useInternalTransactionApprovalModalStackNavigationOptions(
    dappData,
    'Message signature request rejected',
  );

  const handleDeleted = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('app', {
        screen: 'walletDetails',
      });
    }
  };

  const handleApprove = async (data: unknown) => {
    if (!dappData) return;
    await client.resolveApproval({
      requestId: dappData.requestId,
      tabId: dappData.tabId,
      blockchain: IBlockchainType.Evm,
      result: data,
    });
  };

  const handleReject = async () => {
    if (!dappData) return;
    await client.resolveApproval({
      requestId: dappData.requestId,
      tabId: dappData.tabId,
      blockchain: IBlockchainType.Evm,
      error: 'Message sign rejected',
    });
    navigateBack();
  };

  return (
    <SafeMessageProposal
      dappData={dappData}
      signers={signers}
      windowType={windowType}
      walletService={client}
      onApprove={handleApprove}
      onReject={handleReject}
      onClose={navigateBack}
      onDeleted={handleDeleted}
      onTrezorRequest={openTrezorRequestString}
    />
  );
}
