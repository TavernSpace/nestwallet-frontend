import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IMessageProposal,
  ITransaction,
  ITransactionProposal,
  IWallet,
  useSyncWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { useState } from 'react';
import { Platform } from 'react-native';
import {
  NavigationState,
  SceneRendererProps,
  TabView,
} from 'react-native-tab-view';
import { FilterTab } from '../../../components/filter-tab';
import { View } from '../../../components/view';
import { SCREEN_WIDTH } from '../../../design/constants';
import { refreshHapticAsync } from '../../../features/haptic';
import { WindowType, useNestWallet } from '../../../provider/nestwallet';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { FilterSheet } from '../filter-sheet/sheet';
import { HistoryScreenWithQuery } from './history/query';
import { HistorySectionSkeleton } from './history/screen';
import { WalletTransactionMenu } from './menu';

const routes = [
  { key: 'history', title: 'History' },
  { key: 'transactions', title: 'Transactions' },
  { key: 'messages', title: 'Messages' },
];

export function WalletTransactions(props: {
  wallet: IWallet;
  onPressMessageProposal: (proposal: IMessageProposal) => void;
  onPressTransactionProposal: (proposal: ITransactionProposal) => void;
  onPressTransaction: (transaction: ITransaction) => void;
}) {
  const {
    wallet,
    onPressMessageProposal,
    onPressTransactionProposal,
    onPressTransaction,
  } = props;
  const { windowType } = useNestWallet();
  const { showSnackbar } = useSnackbar();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filteredChain, setFilteredChain] = useState(0);
  const [filterSpam, setFilterSpam] = useState(true);
  const [index, setIndex] = useState(0);

  const syncWalletMutation = useMutationEmitter(
    [graphqlType.History],
    useSyncWalletMutation(),
  );

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await syncWalletMutation.mutateAsync({
        input: {
          walletId: wallet.id,
          syncMessages: false,
          syncProposals: false,
          syncHistory: true,
        },
      });
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to refresh history',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const renderLazyPlaceholder = () => <HistorySectionSkeleton rows={3} />;

  // renderScene Needs to be formatted like this to avoid rerenders:
  // https://reactnavigation.org/docs/tab-view#:~:text=IMPORTANT%3A%20Do%20not%20pass%20inline%20functions%20to%20SceneMap%2C%20for%20example%2C%20don%27t%20do%20the%20following%3A
  const renderScene = ({
    route,
  }: SceneRendererProps & {
    route: {
      key: string;
      title: string;
    };
  }) => {
    switch (route.key) {
      case 'history':
        return (
          <HistoryScreenWithQuery
            wallet={wallet}
            filter={{ chainId: filteredChain, spam: !filterSpam }}
            syncing={refreshing}
            type={'all'}
            onPressMessage={onPressMessageProposal}
            onPressTransaction={onPressTransaction}
            onPressPendingTransaction={onPressTransactionProposal}
          />
        );
      case 'transactions':
        return (
          <HistoryScreenWithQuery
            wallet={wallet}
            filter={{ chainId: filteredChain, spam: !filterSpam }}
            syncing={refreshing}
            type={'tx'}
            onPressMessage={onPressMessageProposal}
            onPressTransaction={onPressTransaction}
            onPressPendingTransaction={onPressTransactionProposal}
          />
        );
      case 'messages':
        return (
          <HistoryScreenWithQuery
            wallet={wallet}
            filter={{ chainId: filteredChain, spam: !filterSpam }}
            syncing={refreshing}
            type={'msg'}
            onPressMessage={onPressMessageProposal}
            onPressTransaction={onPressTransaction}
            onPressPendingTransaction={onPressTransactionProposal}
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: NavigationState<{
        key: string;
        title: string;
      }>;
    },
  ) => {
    const { navigationState, position, jumpTo } = props;
    const [width, setWidth] = useState(SCREEN_WIDTH);

    return (
      <View
        className='flex w-full flex-row items-center justify-between'
        onLayout={
          windowType === WindowType.sidepanel
            ? (e) => setWidth(e.nativeEvent.layout.width)
            : undefined
        }
      >
        <View className='flex flex-row py-2 pl-2'>
          {navigationState.routes.map((route, currentIndex) => (
            <FilterTab
              name={route.title}
              routes={navigationState.routes}
              index={currentIndex}
              position={position}
              onPress={() => jumpTo(route.key)}
              key={route.key}
            />
          ))}
        </View>
        <WalletTransactionMenu
          wallet={wallet}
          filter={filteredChain}
          hideSpam={filterSpam}
          refreshing={refreshing}
          // Note: this is needed because on web the tab navigation causes the page offset to shift by the width of the tab
          offsetX={Platform.OS === 'web' ? -width : 0}
          onFilterPress={() => setShowFilterSheet(true)}
          onSpamPress={() => setFilterSpam(!filterSpam)}
          onRefresh={handleRefresh}
          anchorStyle={{ marginTop: -4 }}
        />
      </View>
    );
  };

  return (
    <View className='flex h-full w-full flex-col'>
      <TabView
        navigationState={{
          index,
          routes,
        }}
        swipeEnabled={Platform.OS !== 'web'}
        lazy={true}
        lazyPreloadDistance={0}
        renderLazyPlaceholder={renderLazyPlaceholder}
        renderTabBar={renderTabBar}
        renderScene={renderScene}
        onIndexChange={setIndex}
        // Key is very important. Prevents routes from going out of sync when they get changed/reorderd
        // https://github.com/satya164/react-native-tab-view/issues/1300#issuecomment-989163916
        key={wallet.id}
      />
      <FilterSheet
        blockchain={wallet.blockchain}
        chainId={filteredChain}
        isShowing={showFilterSheet}
        onSelectChain={(chainId) => setFilteredChain(chainId)}
        onClose={() => setShowFilterSheet(false)}
      />
    </View>
  );
}
