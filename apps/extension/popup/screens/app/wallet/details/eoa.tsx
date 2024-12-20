import { useNavigationOptions } from '@nestwallet/app/common/hooks/navigation';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import { View } from '@nestwallet/app/components/view';
import {
  IMintStatus,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { WalletContextProvider } from '@nestwallet/app/provider/wallet';
import { WalletTabBarFloating } from '@nestwallet/app/screens/wallet-details/navigation/tab-bar-floating';
import { WalletDetailsTab } from '@nestwallet/app/screens/wallet-details/navigation/types';
import { useEoaWalletManagement } from '@nestwallet/app/screens/wallet-details/utils/eoa';
import { WalletHeader } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
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

export function EoaWalletDetails(props: {
  wallet: IWallet;
  onReimportWalletPress?: (wallet: IWallet) => void;
}) {
  const { wallet, onReimportWalletPress } = props;
  const { user, accounts } = useUserContext();
  const { lock } = useLockContext();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();

  const [showConnectionSheet, setShowConnectionSheet] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const version = chrome.runtime.getManifest().version;
  const {
    proposalStatus,
    totalClaimableQuestsCount,
    totalClaimableLootboxesCount,
  } = useEoaWalletManagement(wallet, user, version);

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
          onReimportWalletPress={onReimportWalletPress}
          onOpenNewTab={handleOpenNewTab}
          onOpenSidePanel={handleOpenSidePanel}
          onLock={handleLock}
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
                <WalletTabBarFloating
                  isMinted={user.nestStatus === IMintStatus.Minted}
                  totalClaimableQuestsCount={totalClaimableQuestsCount}
                  totalClaimableLootboxesCount={totalClaimableLootboxesCount}
                  proposalStatus={proposalStatus}
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
