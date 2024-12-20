import { IWalletType } from '@nestwallet/app/graphql/client/generated/graphql';
import { SuccessScreen } from '@nestwallet/app/screens/add-wallet/success-signer/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importSignerSuccess'
>;

export const ImportSignerWalletSuccess = withUserContext(
  _ImportSignerWalletSuccess,
);

function _ImportSignerWalletSuccess({ route }: RouteProps) {
  const { walletType } = route.params;
  const navigation = useNavigation();

  const handleContinue = () => {
    if (
      walletType === IWalletType.Ledger ||
      walletType === IWalletType.Trezor
    ) {
      window.close();
    } else {
      navigation.navigate('app', {
        screen: 'walletDetails',
      });
    }
  };

  return <SuccessScreen walletType={walletType} onContinue={handleContinue} />;
}
