import Transport from '@ledgerhq/hw-transport';
import { IWalletType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportHardwareConnectLedgerScreen } from '@nestwallet/app/screens/add-wallet/connect-ledger/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importHardwareConnectLedger'
>;

export const ImportHardwareConnectLedger = withUserContext(
  _ImportHardwareConnectLedger,
);

function _ImportHardwareConnectLedger({ route }: RouteProps) {
  const { blockchain, action } = route.params;
  const navigation = useNavigation();

  const handleContinue = (transport: Transport) => {
    if (!transport) {
      return;
    }
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletChooseAddresses',
        params: {
          blockchain,
          transport: transport,
          walletType: IWalletType.Ledger,
        },
      },
    });
  };

  const closeTab = () => {
    window.close();
  };

  return (
    <ImportHardwareConnectLedgerScreen
      blockchain={blockchain}
      action={action}
      onContinue={handleContinue}
      closeTab={closeTab}
    />
  );
}
