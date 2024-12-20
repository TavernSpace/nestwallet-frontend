import { SuccessScreen } from '@nestwallet/app/screens/add-wallet/success-signer/screen';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  AddWalletStackParamList,
  'importSignerSuccess'
>;

export const ImportSignerWalletSuccess = withUserContext(
  _ImportSignerWalletSuccess,
);

function _ImportSignerWalletSuccess({ route }: RouteProps) {
  const { walletType } = route.params;
  const navigation = useNavigation();

  const handleContinue = async () => {
    navigation.navigate('app', {
      screen: 'walletDetails',
    });
  };

  return <SuccessScreen walletType={walletType} onContinue={handleContinue} />;
}
