import { AddWalletScreen } from '@nestwallet/app/screens/add-wallet/add-wallet/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useNavigateToAddSigner } from '../../../navigation/utils';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletPersonal'
>;

export const AddPersonalWallet = withUserContext(_AddPersonalWallet);

function _AddPersonalWallet({ route }: RouteProps) {
  const { blockchain } = route.params;
  const { navigateToAddSeedPhrase: createSeed } = useNavigateToAddSigner(
    blockchain,
    'create',
  );
  const { navigateToAddPrivateKey, navigateToAddSeedPhrase } =
    useNavigateToAddSigner(blockchain, 'import');

  return (
    <AddWalletScreen
      blockchain={blockchain}
      onPrivateKey={navigateToAddPrivateKey}
      onSeedPhrase={navigateToAddSeedPhrase}
      onCreateNew={createSeed}
    />
  );
}
