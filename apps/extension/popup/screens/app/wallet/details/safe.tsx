import { useNavigationOptions } from '@nestwallet/app/common/hooks/navigation';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import {
  IMintStatus,
  IWallet,
  useSyncWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { WalletContextProvider } from '@nestwallet/app/provider/wallet';
import { WalletTabBarFloating } from '@nestwallet/app/screens/wallet-details/navigation/tab-bar-floating';
import { WalletDetailsTab } from '@nestwallet/app/screens/wallet-details/navigation/types';
import { useSafeWalletManagement } from '@nestwallet/app/screens/wallet-details/utils/safe';
import { WalletHeader } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSignerWallet } from '../../../../hooks/signer';
import { useConnectedSiteQuery } from '../../../../hooks/ui-service';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { ConnectionSheet } from '../connection-sheet';
import { WalletDiscoverTab } from '../discover';
import { WalletExploreTab } from '../explore';
import { WalletHomeTab } from '../home';
import { WalletRewardsTab } from '../rewards';
import { WalletTransactionsTab } from '../transactions';

export function SafeWalletDetails(props: { wallet: IWallet }) {
  const { wallet } = props;
  const { user, accounts } = useUserContext();
  const { lock } = useLockContext();
  const navigation = useNavigation();
  const signer = useSignerWallet(wallet);

  const [showConnectionSheet, setShowConnectionSheet] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const syncWalletMutation = useMutationEmitter(
    [graphqlType.Wallet, graphqlType.Proposal, graphqlType.Message],
    useSyncWalletMutation(),
  );

  // need this to deal with a bunch of checks
  const version = chrome.runtime.getManifest().version;
  const { totalClaimableQuestsCount, totalClaimableLootboxesCount } =
    useSafeWalletManagement(wallet, user, version);

  const userAccount = accounts.find((account) => account.isDefault)!;

  // this query has to be top level since its extension specific
  const connectedSiteQuery = useConnectedSiteQuery();
  const connectedSite = loadDataFromQuery(connectedSiteQuery);

  const handleConnectionPress = () => {
    setShowConnectionSheet(true);
  };

  const handleChangeTab = (index: number) => {
    setShowHeader(index < 2);
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

  const handleOpenNewTab = async () => {
    const url = chrome.runtime.getURL('index.html');
    navigation.goBack();
    await chrome.tabs.create({
      url,
    });
  };

  const handleOpenSidePanel = async () => {
    const currentWindow = await chrome.windows.getCurrent();
    if (currentWindow.id === undefined) return;
    await chrome.sidePanel.open({ windowId: currentWindow.id });
    navigation.goBack();
    window.close();
  };

  const handleLock = async () => {
    await lock();
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
          connectedSite={connectedSite.data}
          onConnectedSitePress={handleConnectionPress}
          onProposalsPress={handleProposalsPress}
          onActivateSafe={handleActivate}
          onOpenNewTab={handleOpenNewTab}
          onOpenSidePanel={handleOpenSidePanel}
          onLock={handleLock}
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
                <WalletTabBarFloating
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
                component={WalletExploreTab}
              />
            </WalletDetailsTab.Navigator>
          </WalletContextProvider>
          <ConnectionSheet
            isShowing={showConnectionSheet}
            onClose={() => setShowConnectionSheet(false)}
          />
        </View>
      </View>
    </View>
  );
}
