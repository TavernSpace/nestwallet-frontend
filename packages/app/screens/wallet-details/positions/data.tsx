import { useState } from 'react';
import { RefreshControl } from 'react-native';
import EmptyTokens from '../../../assets/images/empty-tokens.svg';
import {
  Loadable,
  Preferences,
  VoidPromiseFunction,
} from '../../../common/types';
import { tuple } from '../../../common/utils/functions';
import { composeLoadables, onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import {
  CardEmptyState,
  CardErrorState,
} from '../../../components/card/card-empty-state';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { AssetListItemSkeleton } from '../../../components/skeleton/list-item';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { CryptoPositionItem, Protocol } from '../../../features/crypto/types';
import { visibilityFilter } from '../../../features/crypto/visibility';
import { useSafeAreaInsets } from '../../../features/safe-area';
import {
  IContractVisibility,
  ICryptoBalance,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { walletDetailBottomTabOffset } from '../navigation/tab-bar-floating';
import { CryptoListItem } from './crypto-list-item';
import { ProtocolListItem } from './protocol';

function cryptoKey(crypto: ICryptoBalance) {
  return `${crypto.address}:${crypto.chainId}`;
}

const isHidden = (
  balance: ICryptoBalance,
  map: Record<string, IContractVisibility>,
) => {
  const isOriginalVisible = visibilityFilter(balance);
  const modifiedVisibility = map[cryptoKey(balance)];
  return (
    modifiedVisibility === IContractVisibility.Hidden ||
    (!modifiedVisibility && !isOriginalVisible)
  );
};

interface PositionsWithDataProps {
  wallet: IWallet;
  allPositions: Loadable<CryptoPositionItem[]>;
  positions: Loadable<CryptoPositionItem[]>;
  preferences: Loadable<Preferences>;
  onPressToken: (token: ICryptoBalance) => void;
  refreshing: boolean;
  managed: boolean;
  modifiedVisibilityMap: Record<string, IContractVisibility>;
  onRefresh: VoidPromiseFunction;
  onVisibilityChange: (
    items: ICryptoBalance[],
    visibility: IContractVisibility,
  ) => void;
}

export function PositionsWithData(props: PositionsWithDataProps) {
  const {
    wallet,
    allPositions,
    positions,
    preferences,
    onPressToken,
    refreshing,
    managed,
    modifiedVisibilityMap,
    onRefresh,
    onVisibilityChange,
  } = props;
  const inset = useSafeAreaInsets();

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const handleExpand = (id: string, expanded: boolean) => {
    setExpandedMap({ ...expandedMap, [id]: expanded });
  };

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<
    CryptoPositionItem,
    {
      preferences: Preferences;
      modifiedVisibilityMap: Record<string, IContractVisibility>;
      expandedMap: Record<string, boolean>;
      managed: boolean;
      wallet: IWallet;
    }
  >) => {
    const hiddenGroup = item.groupedBalances.map((item) =>
      isHidden(item, extraData!.modifiedVisibilityMap),
    );
    const hidden =
      hiddenGroup.length > 1
        ? hiddenGroup.every((hidden) => hidden)
        : isHidden(item.balance, extraData!.modifiedVisibilityMap);
    const expanded =
      item.groupedBalances.length > 1 &&
      (extraData!.expandedMap[item.balance.tokenMetadata.id] ||
        extraData!.managed);
    return (
      <CryptoListItem
        balance={item.balance}
        groupedBalances={item.groupedBalances}
        hidden={hidden}
        hiddenGroup={hiddenGroup}
        expanded={expanded}
        managed={extraData!.managed}
        preferences={extraData!.preferences}
        onPress={(balance) => onPressToken(balance)}
        onVisibilityPress={onVisibilityChange}
        onExpand={() => handleExpand(item.balance.tokenMetadata.id, !expanded)}
      />
    );
  };

  return onLoadable(
    composeLoadables(positions, allPositions, preferences)(tuple),
  )(
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton />
        <AssetListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton fixed />
        <AssetListItemSkeleton fixed />
        <View className='-mt-16 items-center justify-center'>
          <CardErrorState
            title={`Unable to get Tokens`}
            description={`Something went wrong trying to get your token balances.`}
          />
        </View>
      </View>
    ),
    ([positions, allPositions, preferences]) =>
      (!managed && positions.length === 0) ||
      (managed && allPositions.length === 0) ? (
        <View className='flex flex-col'>
          <AssetListItemSkeleton fixed />
          <AssetListItemSkeleton fixed />
          <View className='-mt-16 items-center justify-center'>
            <CardEmptyState
              icon={EmptyTokens}
              title={`No Tokens`}
              description={`You do not have any tokens.`}
            />
          </View>
        </View>
      ) : (
        <View className='flex flex-1 flex-col'>
          <FlatList
            data={managed ? allPositions : positions}
            extraData={{
              preferences,
              modifiedVisibilityMap,
              expandedMap,
              managed,
              wallet,
            }}
            estimatedItemSize={adjust(60)}
            renderItem={renderItem}
            keyExtractor={(item) =>
              `${item.balance.address}:${item.balance.chainId}:${item.balance.positionInfo?.id}`
            }
            refreshControl={
              !managed ? (
                <RefreshControl
                  colors={[colors.primary]}
                  progressBackgroundColor={colors.cardHighlight}
                  tintColor={colors.primary}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ) : undefined
            }
            contentContainerStyle={{
              paddingBottom: inset.bottom + walletDetailBottomTabOffset,
            }}
          />
        </View>
      ),
  );
}

interface ProtocolsWithDataProps {
  wallet: IWallet;
  protocols: Loadable<Protocol[]>;
  preferences: Loadable<Preferences>;
  onPressToken: (token: ICryptoBalance) => void;
  refreshing: boolean;
  onRefresh: VoidPromiseFunction;
}

export function ProtocolsWithData(props: ProtocolsWithDataProps) {
  const {
    wallet,
    protocols,
    preferences,
    onPressToken,
    refreshing,
    onRefresh,
  } = props;
  const inset = useSafeAreaInsets();

  // TODO: if this performance is bad need to switch back to individial items
  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<
    Protocol,
    {
      preferences: Preferences;
      wallet: IWallet;
    }
  >) => {
    return (
      <ProtocolListItem
        protocol={item}
        preferences={extraData!.preferences}
        onPress={onPressToken}
      />
    );
  };

  return onLoadable(composeLoadables(protocols, preferences)(tuple))(
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton />
        <AssetListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton fixed />
        <AssetListItemSkeleton fixed />
        <View className='-mt-16 items-center justify-center'>
          <CardErrorState
            title={`Unable to get Positions`}
            description={`Something went wrong trying to get your positions`}
          />
        </View>
      </View>
    ),
    ([protocols, preferences]) =>
      protocols.length === 0 ? (
        <View className='flex flex-col'>
          <AssetListItemSkeleton fixed />
          <AssetListItemSkeleton fixed />
          <View className='-mt-16 items-center justify-center'>
            <CardEmptyState
              icon={EmptyTokens}
              title={`No Positions`}
              description={`You do not have any open positions.`}
            />
          </View>
        </View>
      ) : (
        <View className='flex flex-1 flex-col px-4'>
          <FlatList
            data={protocols}
            extraData={{
              preferences,
              wallet,
            }}
            estimatedItemSize={adjust(160)}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.name}:${item.imageUrl}`}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                progressBackgroundColor={colors.cardHighlight}
                tintColor={colors.primary}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            ItemSeparatorComponent={() => <View className='h-3' />}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: inset.bottom + walletDetailBottomTabOffset,
            }}
          />
        </View>
      ),
  );
}
