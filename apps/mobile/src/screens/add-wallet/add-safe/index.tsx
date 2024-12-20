import { AddSafeScreen } from '@nestwallet/app/screens/add-wallet/add-safe/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletAddSafe'
>;

export const AddSafeWallet = withUserContext(
  ({ route, navigation }: RouteProps) => {
    const onAddExistingWallet = () => {
      navigation.navigate('importWalletExistingSafe');
    };

    const onCreateNew = () => {
      navigation.navigate('createSafe', {
        screen: 'signers',
      });
    };

    return (
      <AddSafeScreen
        onAddExistingWallet={onAddExistingWallet}
        onCreateNew={onCreateNew}
      />
    );
  },
);
