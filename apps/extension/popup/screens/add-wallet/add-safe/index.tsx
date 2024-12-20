import { AddSafeScreen } from '@nestwallet/app/screens/add-wallet/add-safe/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletAddSafe'
>;

export const AddSafeWallet = withUserContext(_AddSafeWallet);

function _AddSafeWallet({ route }: RouteProps) {
  const navigation = useNavigation();

  const onAddExistingWallet = () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletExistingSafe',
      },
    });
  };

  const onCreateNew = async () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'createSafe',
        params: {
          screen: 'signers',
        },
      },
    });
  };

  return (
    <AddSafeScreen
      onAddExistingWallet={onAddExistingWallet}
      onCreateNew={onCreateNew}
    />
  );
}
