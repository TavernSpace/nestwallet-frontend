import { EthereumProvider } from '../../common/provider/evm';
import { WalletRouter } from './router';

export function initEthereumProvider(
  window: Window,
  nestWalletEthereum: EthereumProvider,
) {
  const walletRouter = new WalletRouter(window, nestWalletEthereum);
  // Note: we need to pass in the provider as the proxy target instead of just an empty
  // object due to some dApps like curve not detecting the provider properly otherwise
  const ethereumProvider = new Proxy(nestWalletEthereum, {
    get(target, prop: string) {
      const currentProvider = walletRouter.getCurrentProvider();
      // sites using web3-react force metamask usage by searching
      // window.ethereum.providers we will just return null to avoid that
      // https://github.com/Uniswap/web3-react/blob/f5a54af645a4a2e125ee2f5ead6dd1ecd5d01dda/packages/metamask/src/index.ts#L56-L59
      if (prop === 'providers') {
        return undefined;
      }
      return currentProvider[prop];
    },
  }) as EvmWalletProvider;

  Object.defineProperty(window, 'nestWalletRouter', {
    configurable: false,
    value: walletRouter,
  });
  if (!window.web3) {
    window.web3 = { currentProvider: ethereumProvider };
  }
  if (window.nestwallet) {
    window.nestwallet.ethereum = ethereumProvider;
  }
  // if we can't defineProperty on window.ethereum, try to just set it
  try {
    Object.defineProperty(window, 'ethereum', {
      configurable: false,
      get() {
        return ethereumProvider;
      },
      set(newProvider) {
        walletRouter.addProvider(newProvider);
      },
    });
  } catch (error) {
    window.ethereum = ethereumProvider;
  }
}
