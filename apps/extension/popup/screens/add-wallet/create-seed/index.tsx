import { IKeyring } from '@nestwallet/app/common/types';
import { getKeyringIdentifierFromSeed } from '@nestwallet/app/features/wallet/seedphrase';
import { IWalletType } from '@nestwallet/app/graphql/client/generated/graphql';
import { CreateSeedScreen } from '@nestwallet/app/screens/add-wallet/create-seed/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletCreateSeed'
>;

export const ImportWalletCreateSeed = withUserContext(_ImportWalletCreateSeed);

function _ImportWalletCreateSeed({ route }: RouteProps) {
  const { blockchain, seedPhrase } = route.params;
  const navigation = useNavigation();

  const handleSubmit = async () => {
    const seed = seedPhrase.join(' ');
    const keyringIdentifier = await getKeyringIdentifierFromSeed(
      seed,
      blockchain,
    );
    const keyring: IKeyring = {
      type: IWalletType.SeedPhrase,
      blockchain: blockchain,
      keyringIdentifier: keyringIdentifier,
      value: seed,
    };
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletChooseAddresses',
        params: {
          blockchain,
          keyring: keyring,
          walletType: IWalletType.SeedPhrase,
        },
      },
    });
  };

  return <CreateSeedScreen onSubmit={handleSubmit} seedPhrase={seedPhrase} />;
}
