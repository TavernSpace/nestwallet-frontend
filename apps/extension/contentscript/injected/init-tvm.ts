import { TonProvider } from '../../common/provider/tvm';
import { TonConnect } from '../../common/provider/tvm/tonconnect';

export function initTonProvider(window: Window, tonProvider: TonProvider) {
  const tonConnect = new TonConnect(tonProvider);
  (window as any).tonkeeper = {
    provider: tonProvider,
    tonconnect: tonConnect,
  };
  if (window.nestwallet) {
    window.nestwallet.ton = tonProvider;
    window.nestwallet.tonconnect = tonConnect;
  }
}
