import { generateSeedPhrase } from '@nestwallet/app/features/wallet/seedphrase';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useNavigation } from '@react-navigation/native';

export function useNavigateToAddSigner(
  blockchain: IBlockchainType,
  type: 'create' | 'import',
) {
  const navigation = useNavigation();

  const navigateToImport = async (wallet: IWallet) => {
    if (wallet.type === IWalletType.PrivateKey) {
      navigateToAddPrivateKey();
    } else if (wallet.type === IWalletType.SeedPhrase) {
      navigateToAddSeedPhrase();
    }
  };

  const navigateToAddPrivateKey = async () => {
    if (type === 'import') {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletPrivateKey',
          params: {
            blockchain,
          },
        },
      });
    }
  };

  const navigateToAddSeedPhrase = async () => {
    if (type === 'import') {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletImportSeed',
          params: {
            blockchain,
          },
        },
      });
    } else {
      const seedPhrase = generateSeedPhrase();
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletCreateSeed',
          params: {
            blockchain,
            seedPhrase,
          },
        },
      });
    }
  };

  return {
    navigateToImport,
    navigateToAddPrivateKey,
    navigateToAddSeedPhrase,
  };
}
