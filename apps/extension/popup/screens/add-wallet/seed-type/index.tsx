import { IKeyring } from '@nestwallet/app/common/types';
import {
  defaultTvmSinglePath,
  getKeyringIdentifierFromSeed,
} from '@nestwallet/app/features/wallet/seedphrase';
import {
  IUpsertWalletInput,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportWalletSeedTypeScreen } from '@nestwallet/app/screens/add-wallet/seed-type/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletSeedType'
>;

export const ImportWalletSeedType = withUserContext(_ImportWalletSeedType);

function _ImportWalletSeedType({ route }: RouteProps) {
  const { blockchain, seed } = route.params;
  const navigation = useNavigation();

  const handleMultiple = async () => {
    const keyringIdentifier = await getKeyringIdentifierFromSeed(
      seed,
      blockchain,
    );
    const keyring: IKeyring = {
      type: IWalletType.SeedPhrase,
      blockchain,
      keyringIdentifier,
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

  const handleSingle = async () => {
    const keyringIdentifier = await getKeyringIdentifierFromSeed(
      seed,
      blockchain,
      defaultTvmSinglePath,
    );
    const keyring: IKeyring = {
      type: IWalletType.SeedPhrase,
      blockchain,
      keyringIdentifier,
      value: seed,
    };
    const input: Partial<IUpsertWalletInput> = {
      blockchain,
      type: IWalletType.SeedPhrase,
      address: keyringIdentifier,
      keyringIdentifier,
      derivationPath: defaultTvmSinglePath,
      version: 'V4',
    };
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletChooseName',
        params: {
          input,
          keyring,
        },
      },
    });
  };

  return (
    <ImportWalletSeedTypeScreen
      onMultiple={handleMultiple}
      onSingle={handleSingle}
    />
  );
}
