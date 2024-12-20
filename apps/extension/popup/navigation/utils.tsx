import { shouldOpenTab } from '@nestwallet/app/features/keyring/trezor/utils';
import { generateSeedPhrase } from '@nestwallet/app/features/wallet/seedphrase';
import {
  IBlockchainType,
  ICryptoBalance,
  INftBalance,
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { WindowType, useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useNavigation } from '@react-navigation/native';
import { browser } from 'webextension-polyfill-ts';

export function parsePayload<T extends { payload?: string }>(params: T): T {
  if (!params.payload) {
    return params;
  }
  const parsedPayload = JSON.parse(params.payload);
  return {
    ...params,
    ...parsedPayload,
  };
}

export function openInTab(path: string, payload: object) {
  const params = new URLSearchParams({
    type: WindowType.tab,
    payload: JSON.stringify(payload),
  });
  const url = browser.runtime.getURL('index.html');
  chrome.tabs.create({
    url: `${url}?${params.toString()}#/${path}`,
  });
  window.close();
  return true;
}

export function useWalletActionsNavigation() {
  const nestWalletContext = useNestWallet();
  const navigation = useNavigation();
  const windowType = nestWalletContext.windowType ?? WindowType.none;

  // for trezor, just open these actions in a new tab
  const handlePressSend = (
    wallet: IWallet,
    initialAsset?: ICryptoBalance | INftBalance,
  ) => {
    const params = {
      walletId: wallet.id,
      initialAsset,
    };
    if (shouldOpenTab(windowType, wallet)) {
      openInTab('app/wallet/transferAsset', params);
      return;
    }
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferAsset',
        params,
      },
    });
  };

  const handlePressSwap = (wallet: IWallet, initialAsset?: ICryptoBalance) => {
    const params = initialAsset
      ? {
          walletId: wallet.id,
          initialAsset,
        }
      : {
          walletId: wallet.id,
        };
    if (shouldOpenTab(windowType, wallet)) {
      openInTab(
        initialAsset ? 'app/wallet/swap' : 'app/wallet/swapAsset',
        params,
      );
      return;
    }
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: initialAsset ? 'swap' : 'swapAsset',
        params,
      },
    });
  };

  return {
    navigateToSend: handlePressSend,
    navigateToSwap: handlePressSwap,
  };
}

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
