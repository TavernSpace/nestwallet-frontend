import { View } from '@nestwallet/app/components/view';
import { ICryptoBalance } from '@nestwallet/app/graphql/client/generated/graphql';
import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { DiscoverWithQuery } from '@nestwallet/app/screens/discover/query';
import { useNavigation } from '@react-navigation/native';

export function WalletDiscoverTab() {
  const { wallet } = useWalletContext();
  const navigation = useNavigation();

  const handleTokenPress = (asset: ICryptoBalance) => {
    if (!wallet) return;
    navigation.navigate('app', {
      screen: 'trade',
      params: {
        initialAsset: asset,
        walletId: wallet.id,
      },
    });
  };

  return (
    <View className='h-full w-full'>
      <DiscoverWithQuery wallet={wallet} onTokenPress={handleTokenPress} />
    </View>
  );
}
