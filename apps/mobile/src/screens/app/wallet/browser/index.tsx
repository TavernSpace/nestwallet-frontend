import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { WalletBrowser } from '../../browser';

export function WalletBrowserTab() {
  const { wallet } = useWalletContext();

  return <WalletBrowser wallet={wallet} />;
}
