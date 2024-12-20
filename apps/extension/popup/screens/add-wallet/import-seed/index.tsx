import { IKeyring } from '@nestwallet/app/common/types';
import { getKeyringIdentifierFromSeed } from '@nestwallet/app/features/wallet/seedphrase';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportSeedScreen } from '@nestwallet/app/screens/add-wallet/import-seed/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletImportSeed'
>;

export const ImportWalletImportSeed = withUserContext(_ImportWalletImportSeed);

function _ImportWalletImportSeed({ route }: RouteProps) {
  const { blockchain } = route.params;
  const navigation = useNavigation();

  const handleSubmit = async (seedPhrase: string) => {
    if (blockchain === IBlockchainType.Tvm) {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletSeedType',
          params: {
            blockchain,
            seed: seedPhrase,
          },
        },
      });
    } else {
      const keyringIdentifier = await getKeyringIdentifierFromSeed(
        seedPhrase,
        blockchain,
      );
      const keyring: IKeyring = {
        type: IWalletType.SeedPhrase,
        blockchain,
        keyringIdentifier,
        value: seedPhrase,
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
    }
  };

  return <ImportSeedScreen blockchain={blockchain} onSubmit={handleSubmit} />;
}
