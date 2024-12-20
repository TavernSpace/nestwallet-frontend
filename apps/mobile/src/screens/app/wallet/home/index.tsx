import { Preferences } from '@nestwallet/app/common/types';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import { View } from '@nestwallet/app/components/view';
import { isViewOnlyWallet } from '@nestwallet/app/features/wallet/utils';
import {
  ICryptoBalance,
  INftBalance,
  IOrder,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { defaultCryptoBalance } from '@nestwallet/app/screens/quick-trade/utils';
import { WalletHome } from '@nestwallet/app/screens/wallet-details/home';
import { hasWalletBanner } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignerWallet } from '../../../../hooks/signer';
import { usePreferencesQuery } from '../../../../hooks/wallet';
import { useAppContext } from '../../../../provider/application';

export function WalletHomeTab() {
  const { wallet } = useWalletContext();
  const { userService } = useAppContext();
  const { top } = useSafeAreaInsets();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();

  const preferencesQuery = usePreferencesQuery();
  const preferences = loadDataFromQuery(preferencesQuery);

  const handleChangePreferences = async (input: Preferences) => {
    await userService.setPreferences(input);
    await preferencesQuery.refetch();
  };

  const handleTokenPress = (token: ICryptoBalance) => {
    navigation.navigate('app', {
      screen: 'trade',
      params: {
        initialAsset: token,
        walletId: wallet.id,
      },
    });
  };

  const handleNftPress = (nft: INftBalance) => {
    navigation.navigate('app', {
      screen: 'nftDetails',
      params: {
        nft: nft,
        walletId: wallet.id,
      },
    });
  };

  const handleOrderPress = (order: IOrder) => {
    if (order.limitOrder) {
      navigation.navigate('app', {
        screen: 'trade',
        params: {
          initialAsset: defaultCryptoBalance({
            address: order.limitOrder.fromToken.address,
            chainId: order.limitOrder.chainId,
            price: order.limitOrder.fromToken.price,
            symbol: order.limitOrder.fromToken.symbol,
            decimals: order.limitOrder.fromToken.decimals,
            name: order.limitOrder.fromToken.name,
            logo: order.limitOrder.fromToken.imageUrl,
          }),
          walletId: wallet.id,
        },
      });
    }
  };

  const handleReceivePress = () => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'receive',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleSendPress = () => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferAsset',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleSwapPress = () => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'swapAsset',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const { bannerCount } = hasWalletBanner(signer);
  const headerHeight = 48 + Math.max(16, top) + 48 * bannerCount;
  const viewOnly = isViewOnlyWallet(signer);

  return (
    <View className='h-full w-full'>
      <WalletHome
        wallet={wallet}
        headerHeight={headerHeight}
        viewOnly={viewOnly}
        preferences={preferences}
        onTokenPress={handleTokenPress}
        onNftPress={handleNftPress}
        onOrderPress={handleOrderPress}
        onChangePreferences={handleChangePreferences}
        onReceivePress={handleReceivePress}
        onSendPress={handleSendPress}
        onSwapPress={handleSwapPress}
      />
    </View>
  );
}
