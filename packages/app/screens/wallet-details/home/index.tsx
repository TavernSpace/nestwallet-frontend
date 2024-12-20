import {
  IBlockchainType,
  IContractVisibility,
  ICryptoBalance,
  INftBalance,
  IOrder,
  IOrderFilter,
  IOrderInputType,
  IWallet,
  useOrdersQuery,
  useUpsertContractPermissionsMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import cn from 'classnames';
import { findIndex } from 'lodash';
import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  NavigationState,
  SceneRendererProps,
  TabView,
} from 'react-native-tab-view';
import { useMutationEmitter } from '../../../common/hooks/query';
import { Loadable, Preferences } from '../../../common/types';
import { loadDataFromQuery } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { BaseButton } from '../../../components/button/base-button';
import { FilterTab } from '../../../components/filter-tab';
import { AssetListItemSkeleton } from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import { graphqlType } from '../../../graphql/types';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { useTabBarVisibilityContext } from '../../../provider/tab-bar';
import { WalletCollections } from '../collections';
import { NFTDisplay } from '../collections/types';
import { FilterSheet } from '../filter-sheet/sheet';
import { WalletOrders } from '../orders';
import { WalletPositions } from '../positions';
import { WalletHomeMenu } from './menu';
import { WalletSummaryWithQuery } from './summary';

function cryptoKey(crypto: ICryptoBalance) {
  return `${crypto.address}:${crypto.chainId}`;
}

function collectionKey(collection: string, chainId: number) {
  return `${collection}:${chainId}`;
}

interface WalletHomeProps {
  wallet: IWallet;
  headerHeight: number;
  viewOnly: boolean;
  preferences: Loadable<Preferences>;
  onTokenPress: (token: ICryptoBalance) => void;
  onNftPress: (nft: INftBalance) => void;
  onOrderPress: (order: IOrder) => void;
  onChangePreferences: (input: Preferences) => Promise<void>;
  onSendPress: VoidFunction;
  onReceivePress: VoidFunction;
  onSwapPress: VoidFunction;
}

export function WalletHome(props: WalletHomeProps) {
  const {
    wallet,
    headerHeight,
    viewOnly,
    preferences,
    onNftPress,
    onOrderPress,
    onTokenPress,
    onChangePreferences,
    onReceivePress,
    onSendPress,
    onSwapPress,
  } = props;
  const { showTabBar, hideTabBar } = useTabBarVisibilityContext();
  const { showSnackbar } = useSnackbar();

  const [filter, setFilter] = useState(0);
  const [refreshingTokens, setRefreshingTokens] = useState(false);
  const [refreshingNFTs, setRefreshingNFTs] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [nftDisplay, setNftDisplay] = useState<NFTDisplay>('list');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [managed, setManaged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modifiedVisibilityMap, setModifiedVisibilityMap] = useState<
    Record<string, IContractVisibility>
  >({});
  const [index, setIndex] = useState(0);

  const contractPermissionMutation = useMutationEmitter(
    graphqlType.ContractPermission,
    useUpsertContractPermissionsMutation(),
  );

  const ordersQuery = useOrdersQuery(
    {
      input: {
        walletId: wallet.id,
        type: IOrderInputType.All,
        filter: IOrderFilter.Pending,
      },
    },
    {
      enabled: wallet.blockchain === IBlockchainType.Svm,
      staleTime: 30 * 1000,
    },
  );
  const orders = loadDataFromQuery(ordersQuery, (data) =>
    data.orders.edges.map((edge) => edge.node as IOrder),
  );

  const handleChangePreferences = async (preferences: Preferences) => {
    try {
      await onChangePreferences(preferences);
    } catch (err) {
      const error = parseError(err, 'Failed to modify preferences');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleCancelVisibility = () => {
    setManaged(false);
    setModifiedVisibilityMap({});
    showTabBar();
  };

  const handleRefreshTokens = () => {
    if (refreshingTokens) return;
    setRefreshingTokens(true);
  };

  const handleRefreshNFTs = () => {
    if (refreshingNFTs) return;
    setRefreshingNFTs(true);
  };

  const handleRefreshOrders = () => {
    if (refreshingOrders) return;
    setRefreshingOrders(true);
  };

  const handleSaveVisibility = async () => {
    try {
      setLoading(true);
      const input = Object.keys(modifiedVisibilityMap).map((key) => {
        const visibility = modifiedVisibilityMap[key]!;
        const [address, chain] = key.split(':');
        return {
          visibility,
          address: address!,
          chainId: parseInt(chain!),
        };
      });
      await contractPermissionMutation.mutateAsync({ input });
      setManaged(false);
      setModifiedVisibilityMap({});
      showTabBar();
    } catch (err) {
      const error = parseError(err, 'Failed to save token status');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTokenVisibility = (
    items: ICryptoBalance[],
    visibility: IContractVisibility,
  ) => {
    const newMap = {
      ...modifiedVisibilityMap,
    };
    items.forEach((item) => {
      newMap[cryptoKey(item)] = visibility;
    });
    setModifiedVisibilityMap(newMap);
  };

  const handleChangeCollectionVisibility = (
    collection: string,
    chainId: number,
    visibility: IContractVisibility,
  ) => {
    const newMap = {
      ...modifiedVisibilityMap,
      [collectionKey(collection, chainId)]: visibility,
    };
    setModifiedVisibilityMap(newMap);
  };

  const handleManage = () => {
    setManaged(true);
    hideTabBar();
  };

  const renderLazyPlaceholder = () => (
    <View className='flex flex-col'>
      <AssetListItemSkeleton />
      <AssetListItemSkeleton />
    </View>
  );

  //renderScene Needs to be formatted like this to avoid rerenders:
  //https://reactnavigation.org/docs/tab-view#:~:text=IMPORTANT%3A%20Do%20not%20pass%20inline%20functions%20to%20SceneMap%2C%20for%20example%2C%20don%27t%20do%20the%20following%3A
  const renderScene = ({
    route,
  }: SceneRendererProps & {
    route: {
      key: string;
      title: string;
    };
  }) => {
    switch (route.key) {
      case 'tokens':
        return (
          <WalletPositions
            wallet={wallet}
            type={'asset'}
            filteredChain={filter}
            managed={managed}
            modifiedVisibilityMap={modifiedVisibilityMap}
            preferences={preferences}
            refreshing={refreshingTokens}
            onPressToken={onTokenPress}
            onStartRefresh={handleRefreshTokens}
            onEndRefresh={() => setRefreshingTokens(false)}
            onChangeVisibility={handleChangeTokenVisibility}
          />
        );
      case 'positions':
        return (
          <WalletPositions
            wallet={wallet}
            type={'position'}
            filteredChain={filter}
            managed={managed}
            modifiedVisibilityMap={modifiedVisibilityMap}
            preferences={preferences}
            refreshing={refreshingTokens}
            onPressToken={onTokenPress}
            onStartRefresh={handleRefreshTokens}
            onEndRefresh={() => setRefreshingTokens(false)}
            onChangeVisibility={handleChangeTokenVisibility}
          />
        );
      case 'nfts':
        return (
          <WalletCollections
            wallet={wallet}
            display={nftDisplay}
            filteredChain={filter}
            managed={managed}
            modifiedVisibilityMap={modifiedVisibilityMap}
            refreshing={refreshingNFTs}
            onPressNft={onNftPress}
            onStartRefresh={handleRefreshNFTs}
            onEndRefresh={() => setRefreshingNFTs(false)}
            onChangeVisibility={handleChangeCollectionVisibility}
          />
        );
      case 'orders':
        return (
          <WalletOrders
            wallet={wallet}
            filteredChain={filter}
            refreshing={refreshingOrders}
            onStartRefresh={handleRefreshOrders}
            onEndRefresh={() => setRefreshingOrders(false)}
            onOrderPress={onOrderPress}
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

    const tokenIndex = findIndex(routes, (route) => route.key === 'tokens');
    const nftIndex = findIndex(routes, (route) => route.key === 'nfts');
    const orderIndex = findIndex(routes, (route) => route.key === 'orders');

    return (
      <View
        className={cn(
          'flex h-10 w-full flex-row items-center justify-between',
          { 'mt-2': Platform.OS === 'web' },
        )}
      >
        {!managed ? (
          <View className='flex w-full flex-row items-center justify-between'>
            <View className='ml-2 flex flex-row'>
              {navigationState.routes.map((route, currentIndex) => (
                <FilterTab
                  name={route.title}
                  index={currentIndex}
                  count={
                    currentIndex === orderIndex &&
                    orders.success &&
                    orders.data.length > 0
                      ? orders.data.length
                      : undefined
                  }
                  routes={navigationState.routes}
                  position={position}
                  onPress={() => jumpTo(route.key)}
                  key={route.key}
                />
              ))}
            </View>
            <WalletHomeMenu
              wallet={wallet}
              filter={filter}
              preferences={preferences}
              refreshingTokens={refreshingTokens}
              refreshingNFTs={refreshingNFTs}
              refreshingOrders={refreshingOrders}
              nftView={nftDisplay}
              onChangePreferences={onChangePreferences}
              onFilterPress={() => setShowFilterSheet(true)}
              onManageTokensPress={
                index === tokenIndex ? handleManage : undefined
              }
              onManageNFTsPress={index === nftIndex ? handleManage : undefined}
              onChangeNFTView={
                index === nftIndex
                  ? () => setNftDisplay(nftDisplay === 'list' ? 'grid' : 'list')
                  : undefined
              }
              onRefreshTokens={
                index !== nftIndex && index !== orderIndex
                  ? handleRefreshTokens
                  : undefined
              }
              onRefreshNFTs={index === nftIndex ? handleRefreshNFTs : undefined}
              onRefreshOrders={
                index === orderIndex ? handleRefreshOrders : undefined
              }
              anchorStyle={{ marginTop: -4 }}
            />
          </View>
        ) : (
          <View className='flex w-full flex-row items-center justify-between px-4'>
            <BaseButton onPress={handleCancelVisibility} disabled={loading}>
              <View className='bg-failure/10 rounded-lg px-2 py-1'>
                <Text className='text-failure text-sm font-medium'>
                  {'Cancel'}
                </Text>
              </View>
            </BaseButton>
            <BaseButton onPress={handleSaveVisibility} disabled={loading}>
              <View className='bg-success/10 flex flex-row space-x-2 rounded-lg px-2 py-1'>
                {loading && (
                  <ActivityIndicator
                    size={adjust(14, 2)}
                    color={colors.success}
                  />
                )}
                <Text className='text-success text-sm font-medium'>
                  {'Save'}
                </Text>
              </View>
            </BaseButton>
          </View>
        )}
      </View>
    );
  };

  const routes = useMemo(
    () =>
      onBlockchain(wallet.blockchain)(
        () => [
          { key: 'tokens', title: 'Tokens' },
          { key: 'positions', title: 'Positions' },
          { key: 'nfts', title: 'NFTs' },
        ],
        () => [
          { key: 'tokens', title: 'Tokens' },
          { key: 'nfts', title: 'NFTs' },
          { key: 'orders', title: 'Orders' },
        ],
        () => [
          { key: 'tokens', title: 'Tokens' },
          { key: 'nfts', title: 'NFTs' },
        ],
      ),
    [wallet.blockchain],
  );

  return (
    <View className='h-full w-full'>
      <View
        className={cn('bg-card border-b-card-highlight border-b pb-2', {
          'mb-2': Platform.OS !== 'web',
        })}
        style={{ paddingTop: headerHeight }}
      >
        <WalletSummaryWithQuery
          wallet={wallet}
          viewOnly={viewOnly}
          preferences={preferences}
          onChangePreferences={handleChangePreferences}
          onSendPress={onSendPress}
          onReceivePress={onReceivePress}
          onSwapPress={onSwapPress}
        />
      </View>

      <TabView
        navigationState={{
          index: index >= routes.length ? 0 : index,
          routes,
        }}
        swipeEnabled={Platform.OS !== 'web'}
        lazy={true}
        lazyPreloadDistance={0}
        renderLazyPlaceholder={renderLazyPlaceholder}
        renderTabBar={renderTabBar}
        renderScene={renderScene}
        onIndexChange={setIndex}
        key={wallet.id}
        // Key is very important. Prevents routes from going out of sync when they get changed/reorderd Ex: switching wallets from sol to evm will add the 'positions' tab. Bugs occur
        // https://github.com/satya164/react-native-tab-view/issues/1300#issuecomment-989163916
      />
      <FilterSheet
        blockchain={wallet.blockchain}
        chainId={filter}
        isShowing={showFilterSheet}
        onSelectChain={(chain) => setFilter(chain)}
        onClose={() => setShowFilterSheet(false)}
      />
    </View>
  );
}
