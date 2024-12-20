import { View } from '@nestwallet/app/components/view';
import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { hasWalletBanner } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useSignerWallet } from '../../../../hooks/signer';
import { WalletExplore } from '../../explore';

export function WalletExploreTab() {
  const { wallet } = useWalletContext();

  const { bannerCount } = hasWalletBanner(useSignerWallet(wallet));
  const headerHeight = 56 + 44 * bannerCount;

  return (
    <View className='h-full w-full'>
      <WalletExplore />
    </View>
  );
}
