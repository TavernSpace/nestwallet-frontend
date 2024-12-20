import { useNavigationOptions } from '@nestwallet/app/common/hooks/navigation';
import { View } from '@nestwallet/app/components/view';
import { parseError } from '@nestwallet/app/features/errors';
import { tryParseWalletConnectError } from '@nestwallet/app/features/errors/walletconnect';
import { getCurrentVersion } from '@nestwallet/app/features/version';
import {
  IBlockchainType,
  IMintStatus,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { WalletContextProvider } from '@nestwallet/app/provider/wallet';
import { WalletTabBarAttached } from '@nestwallet/app/screens/wallet-details/navigation/tab-bar-attached';
import { WalletDetailsTab } from '@nestwallet/app/screens/wallet-details/navigation/types';
import { useEoaWalletManagement } from '@nestwallet/app/screens/wallet-details/utils/eoa';
import { WalletHeader } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useSignerWallet } from '../../../../hooks/signer';
import { useAppContext } from '../../../../provider/application';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { WalletBrowserTab } from '../browser';
import { WalletDiscoverTab } from '../discover';
import { WalletHomeTab } from '../home';
import { WalletRewardsTab } from '../rewards';
import { WalletTransactionsTab } from '../transactions';

export function EoaWalletDetails(props: {
  wallet: IWallet;
  onReimportWalletPress?: (wallet: IWallet) => void;
}) {
  const { wallet, onReimportWalletPress } = props;
  const { walletConnectProvider, tonConnectProvider } = useAppContext();
  const { user, accounts } = useUserContext();
  const { lock } = useLockContext();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();

  const [showHeader, setShowHeader] = useState(true);

  const version = getCurrentVersion();
  const {
    proposalStatus,
    totalClaimableQuestsCount,
    totalClaimableLootboxesCount,
  } = useEoaWalletManagement(wallet, user, version);

  const userAccount = accounts.find((account) => account.isDefault)!;

  const handleChangeTab = (index: number) => {
    setShowHeader(index < 2);
  };

  const handleSelectWallet = () => {
    navigation.navigate('app', {
      screen: 'walletSelector',
    });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('app', {
      screen: 'notifications',
    });
  };

  const handleSettingsPress = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'index',
        params: { walletId: wallet.id },
      },
    });
  };

  const handleLock = async () => {
    await lock();
  };

  const handleQRCodeScan = async (data: string) => {
    try {
      if (signer.blockchain === IBlockchainType.Tvm) {
        await tonConnectProvider.connect(data);
      } else {
        await walletConnectProvider.connect(data);
      }
    } catch (e) {
      const error = tryParseWalletConnectError(e);
      if (error) {
        throw new Error('Failed to pair with dApp: ' + error.message);
      } else {
        const error = parseError(e, 'Failed to pair with dApp');
        throw new Error(error.message);
      }
    }
  };

  useNavigationOptions({
    headerShown: true,
    headerTransparent: true,
    header: () =>
      showHeader ? (
        <WalletHeader
          user={user}
          wallet={signer}
          userAccount={userAccount}
          onSelectWallet={handleSelectWallet}
          onNotificationPress={handleNotificationsPress}
          onSettingsPress={handleSettingsPress}
          onReimportWalletPress={onReimportWalletPress}
          onLock={handleLock}
          onQRCodeScan={handleQRCodeScan}
        />
      ) : null,
  });

  return (
    <View className='absolute h-full w-full'>
      <View className='relative flex h-full flex-col'>
        <View className='flex-1'>
          <WalletContextProvider wallet={wallet}>
            <WalletDetailsTab.Navigator
              screenOptions={{
                lazy: true,
                swipeEnabled: false,
              }}
              tabBar={(props) => (
                <WalletTabBarAttached
                  isMinted={user.nestStatus === IMintStatus.Minted}
                  totalClaimableQuestsCount={totalClaimableQuestsCount}
                  totalClaimableLootboxesCount={totalClaimableLootboxesCount}
                  onChangeTab={handleChangeTab}
                  proposalStatus={proposalStatus}
                  {...props}
                />
              )}
            >
              <WalletDetailsTab.Screen name='home' component={WalletHomeTab} />
              <WalletDetailsTab.Screen
                name='transactions'
                component={WalletTransactionsTab}
              />
              <WalletDetailsTab.Screen
                name='discover'
                component={WalletDiscoverTab}
              />
              <WalletDetailsTab.Screen
                name='rewards'
                component={WalletRewardsTab}
              />
              <WalletDetailsTab.Screen
                name='browser'
                component={WalletBrowserTab}
              />
            </WalletDetailsTab.Navigator>
          </WalletContextProvider>
        </View>
      </View>
    </View>
  );
}
