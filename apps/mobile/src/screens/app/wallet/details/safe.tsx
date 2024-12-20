import { useNavigationOptions } from '@nestwallet/app/common/hooks/navigation';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { parseError } from '@nestwallet/app/features/errors';
import { tryParseWalletConnectError } from '@nestwallet/app/features/errors/walletconnect';
import { refreshHapticAsync } from '@nestwallet/app/features/haptic';
import { getCurrentVersion } from '@nestwallet/app/features/version';
import {
  IMintStatus,
  IWallet,
  useSyncWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { WalletContextProvider } from '@nestwallet/app/provider/wallet';
import { WalletTabBarAttached } from '@nestwallet/app/screens/wallet-details/navigation/tab-bar-attached';
import { WalletDetailsTab } from '@nestwallet/app/screens/wallet-details/navigation/types';
import { useSafeWalletManagement } from '@nestwallet/app/screens/wallet-details/utils/safe';
import { WalletHeader } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSignerWallet } from '../../../../hooks/signer';
import { useAppContext } from '../../../../provider/application';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { WalletBrowserTab } from '../browser';
import { WalletDiscoverTab } from '../discover';
import { WalletHomeTab } from '../home';
import { WalletRewardsTab } from '../rewards';
import { WalletTransactionsTab } from '../transactions';

export function SafeWalletDetails(props: { wallet: IWallet }) {
  const { wallet } = props;
  const { walletConnectProvider } = useAppContext();
  const { user, accounts } = useUserContext();
  const { lock } = useLockContext();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();

  const [showHeader, setshowHeader] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const syncWalletMutation = useMutationEmitter(
    [graphqlType.Wallet, graphqlType.Proposal, graphqlType.Message],
    useSyncWalletMutation(),
  );

  const version = getCurrentVersion();
  const { totalClaimableQuestsCount, totalClaimableLootboxesCount } =
    useSafeWalletManagement(wallet, user, version);

  const userAccount = accounts.find((account) => account.isDefault)!;

  const handleChangeTab = (index: number) => {
    setshowHeader(index < 2);
  };

  const handleActivate = async () => {
    navigation.navigate('app', {
      screen: 'activateSafe',
      params: {
        walletId: wallet.id,
      },
    });
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

  const handleProposalsPress = () => {
    navigation.navigate('app', {
      screen: 'walletProposals',
      params: { walletId: wallet.id },
    });
  };

  const handleLock = async () => {
    await lock();
  };

  const handleQRCodeScan = async (data: string) => {
    try {
      await walletConnectProvider.connect(data);
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

  const handleSyncProposals = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await syncWalletMutation.mutateAsync({
        input: {
          walletId: wallet.id,
          syncMessages: true,
          syncProposals: true,
          syncHistory: false,
        },
      });
      refreshHapticAsync();
    } finally {
      setRefreshing(false);
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
          onProposalsPress={handleProposalsPress}
          onActivateSafe={handleActivate}
          onLock={handleLock}
          onQRCodeScan={handleQRCodeScan}
          onSyncProposals={handleSyncProposals}
        />
      ) : null,
  });

  return (
    <View className='absolute h-full w-full'>
      <View className='flex h-full w-full flex-col'>
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
