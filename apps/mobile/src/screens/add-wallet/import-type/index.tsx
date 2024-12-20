import { ImportWalletTypeScreen } from '@nestwallet/app/screens/add-wallet/import-type/screen';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  AddWalletStackParamList,
  'importWalletType'
>;

export const ImportWalletType = withUserContext(_ImportWalletType);

function _ImportWalletType({ route }: RouteProps) {
  const { blockchain } = route.params;
  const navigation = useNavigation();

  const handleAddSigner = () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletPersonal',
        params: {
          blockchain,
        },
      },
    });
  };

  const handleAddSafe = async () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletAddSafe',
      },
    });
  };

  return (
    <ImportWalletTypeScreen
      blockchain={blockchain}
      onAddSafe={handleAddSafe}
      onAddSigner={handleAddSigner}
    />
  );
}
