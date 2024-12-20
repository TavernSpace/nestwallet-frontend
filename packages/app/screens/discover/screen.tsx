import {
  faFireFlameCurved,
  faSparkle,
  faStar,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isNil } from 'lodash';
import { styled } from 'nativewind';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';
import { delay } from '../../common/api/utils';
import { formatAddress } from '../../common/format/address';
import { formatMoney, formatPercentage } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { Loadable, VoidPromiseFunction } from '../../common/types';
import { opacity } from '../../common/utils/functions';
import { onLoadable } from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import {
  CardEmptyState,
  CardErrorState,
} from '../../components/card/card-empty-state';
import { FlatList } from '../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { SearchInput } from '../../components/search-input';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { useDimensions } from '../../features/dimensions';
import { refreshHapticAsync } from '../../features/haptic';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  IBlockchainType,
  ICryptoBalance,
  ITokenDiscoverData,
  ITokenSearchResultOverview,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { defaultCryptoBalance } from '../quick-trade/utils';
import { FilterSheet } from './filter-sheet/sheet';
import { SearchPanel } from './search';
import { DiscoverType } from './types';

const modeChangeAnimationDuration = 300;

export function DiscoverScreen(props: {
  wallet: IWallet;
  chainFilter: number;
  typeFilter: DiscoverType;
  tokens: Loadable<ITokenDiscoverData[]>;
  onTokenPress: (asset: ICryptoBalance) => void;
  onChainChange: (chainId: number) => void;
  onTypeChange: (type: DiscoverType) => void;
  onRefreshTrending: VoidPromiseFunction;
}) {
  const {
    wallet,
    chainFilter,
    typeFilter,
    tokens,
    onTokenPress,
    onChainChange,
    onTypeChange,
    onRefreshTrending,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { bottom, top } = useSafeAreaInsets();
  const { height } = useDimensions();

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [delayedSearch, setDelayedSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const debouncedSetSearch = useDebounceCallback(
    useCallback((search: string) => setDelayedSearch(search), []),
    500,
  );

  const viewTranslationY = useSharedValue(0);
  const viewOpacity = useSharedValue(1);
  const viewScale = useSharedValue(1);

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: viewTranslationY.value },
        { scale: viewScale.value },
      ],
      opacity: viewOpacity.value,
    };
  });

  const staticViewStyle = useMemo(
    () => ({
      height: height - top - 64,
    }),
    [],
  );

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await onRefreshTrending();
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to update trending tokens',
      });
    }
    setRefreshing(false);
  };

  const handleTrendingPress = (token: ITokenDiscoverData) => {
    const balance = defaultCryptoBalance({
      address: token.address,
      chainId: token.chainId,
      decimals: token.decimals,
      logo: token.logoUrl ?? undefined,
      name: token.name ?? '',
      symbol: token.symbol ?? '',
      price: token.price?.toString(),
    });
    onTokenPress(balance);
  };

  const handleSearchResultPress = (token: ITokenSearchResultOverview) => {
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    const balance = defaultCryptoBalance({
      address: token.metadata.address,
      chainId: token.chainId,
      decimals: token.metadata.decimals,
      logo: token.metadata.imageUrl,
      name: token.metadata.name,
      symbol: token.metadata.symbol,
      price: token.price.toString(),
    });
    onTokenPress(balance);
  };

  const handleShowSearch = async () => {
    if (showSearch) return;
    viewTranslationY.value = withTiming(300, {
      duration: modeChangeAnimationDuration,
    });
    viewOpacity.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
    });
    await delay(modeChangeAnimationDuration);
    setShowSearch(true);
    viewTranslationY.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
      easing: Easing.out(Easing.exp),
    });
    viewOpacity.value = withTiming(1, {
      duration: modeChangeAnimationDuration,
    });
  };

  const handleHideSearch = async () => {
    Keyboard.dismiss();
    viewTranslationY.value = withTiming(300, {
      duration: modeChangeAnimationDuration,
    });
    viewOpacity.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
    });
    await delay(modeChangeAnimationDuration);
    setShowSearch(false);
    setSearch('');
    setDelayedSearch('');
    viewTranslationY.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
      easing: Easing.out(Easing.exp),
    });
    viewOpacity.value = withTiming(1, {
      duration: modeChangeAnimationDuration,
    });
  };

  const HotEmptyComponent = () => (
    <View className='flex flex-col space-y-3'>
      <Skeleton
        width='100%'
        height={adjust(120)}
        borderRadius={16}
        fixed={true}
      />
      <Skeleton
        width='100%'
        height={adjust(120)}
        borderRadius={16}
        fixed={true}
      />
      <View className='-mt-8 flex flex-col items-center justify-center space-y-1'>
        <Text className='text-text-primary text-sm font-medium'>
          {'No Trending Tokens Found'}
        </Text>
        <Text className='text-text-secondary text-xs font-normal'>
          {'You can still browse any token above.'}
        </Text>
      </View>
    </View>
  );

  const NewEmptyComponent = () => (
    <View className='mt-20'>
      <CardEmptyState
        overrideIcon={
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faSparkle}
              size={48}
              color={colors.primary}
            />
          </View>
        }
        title='Coming Soon'
        description='Real time tracking for new tokens is coming soon!'
      />
    </View>
  );

  const FavoritesEmptyComponent = () => (
    <View className='mt-20'>
      <CardEmptyState
        overrideIcon={
          <View
            className='h-20 w-20 items-center justify-center rounded-full'
            style={{ backgroundColor: opacity(colors.approve, 10) }}
          >
            <FontAwesomeIcon icon={faStar} size={48} color={colors.approve} />
          </View>
        }
        title='No Favorites Found'
        description='To add a token as a favorite, press the star button next to its name on the token details screen'
      />
    </View>
  );

  const EmptyComponent =
    typeFilter === DiscoverType.Hot ? (
      <HotEmptyComponent />
    ) : typeFilter == DiscoverType.New ? (
      <NewEmptyComponent />
    ) : (
      <FavoritesEmptyComponent />
    );

  useEffect(() => {
    setSearch('');
    debouncedSetSearch('');
    setDelayedSearch('');
    setShowSearch(false);
  }, [wallet.id]);

  return (
    <ViewWithInset
      className='h-full w-full'
      hasTopInset={true}
      hasBottomInset={false}
    >
      <View className='flex h-full w-full flex-col space-y-3'>
        <View className='flex flex-row items-center px-4'>
          <View className='flex-1'>
            <SearchInput
              inputProps={{
                placeholder: 'Search tokens',
                onChangeText: (value) => {
                  if (value !== '') {
                    handleShowSearch();
                  }
                  setSearch(value);
                  debouncedSetSearch(value);
                },
                value: search,
                onFocus: handleShowSearch,
              }}
              onClear={() => {
                setSearch('');
                debouncedSetSearch('');
                setDelayedSearch('');
              }}
              onCancel={showSearch ? handleHideSearch : undefined}
            />
          </View>
        </View>
        <View className='flex flex-1 flex-col'>
          {!showSearch && (
            <Animated.View style={[staticViewStyle, animatedViewStyle]}>
              <View className='flex flex-1 flex-col space-y-3 px-4'>
                <View className='flex flex-row items-center justify-between'>
                  <View className='bg-card flex flex-row items-center overflow-hidden rounded-xl'>
                    <DiscoverTab
                      title='Hot'
                      icon={faFireFlameCurved}
                      iconColor={colors.failure}
                      isSelected={typeFilter === DiscoverType.Hot}
                      onPress={() => onTypeChange(DiscoverType.Hot)}
                    />
                    <DiscoverTab
                      title='Favorites'
                      icon={faStar}
                      iconColor={colors.approve}
                      isSelected={typeFilter === DiscoverType.Favorites}
                      onPress={() => onTypeChange(DiscoverType.Favorites)}
                    />
                  </View>
                  {wallet.blockchain === IBlockchainType.Evm &&
                  typeFilter !== DiscoverType.Favorites ? (
                    <View className='flex flex-row items-center space-x-2'>
                      <BaseButton onPress={() => setShowFilterSheet(true)}>
                        <ChainAvatar
                          shape='square'
                          chainInfo={getChainInfo(chainFilter)}
                          size={adjust(28, 2)}
                        />
                      </BaseButton>
                    </View>
                  ) : (
                    <View />
                  )}
                </View>

                <View className='flex-1'>
                  {onLoadable(tokens)(
                    () => (
                      <View className='space-y-3'>
                        <Skeleton
                          width='100%'
                          height={adjust(120)}
                          borderRadius={16}
                        />
                        <Skeleton
                          width='100%'
                          height={adjust(120)}
                          borderRadius={16}
                        />
                        <Skeleton
                          width='100%'
                          height={adjust(120)}
                          borderRadius={16}
                        />
                        <Skeleton
                          width='100%'
                          height={adjust(120)}
                          borderRadius={16}
                        />
                      </View>
                    ),
                    () => (
                      <View className='flex flex-col'>
                        <View className='flex flex-col space-y-3'>
                          <Skeleton
                            width='100%'
                            height={adjust(120)}
                            borderRadius={16}
                            fixed={true}
                          />
                          <Skeleton
                            width='100%'
                            height={adjust(120)}
                            borderRadius={16}
                            fixed={true}
                          />
                        </View>
                        <View className='-mt-24'>
                          <CardErrorState
                            title='Unable to get trending tokens'
                            description='Something went wrong trying to get trending tokens.'
                          />
                        </View>
                      </View>
                    ),
                    (tokens) => (
                      <FlatList
                        data={tokens}
                        extraData={typeFilter}
                        renderItem={({ item }) => (
                          <TrendingTokenItem
                            token={item}
                            showChain={typeFilter === DiscoverType.Favorites}
                            onPress={() => handleTrendingPress(item)}
                          />
                        )}
                        estimatedItemSize={120}
                        ItemSeparatorComponent={() => <View className='h-3' />}
                        ListEmptyComponent={EmptyComponent}
                        contentContainerStyle={{
                          paddingBottom:
                            Platform.OS === 'web' ? 92 : bottom + 64,
                        }}
                        keyExtractor={(item) =>
                          `${item.address}:${item.chainId}`
                        }
                        refreshControl={
                          <RefreshControl
                            colors={[colors.primary]}
                            progressBackgroundColor={colors.cardHighlight}
                            tintColor={colors.primary}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                          />
                        }
                      />
                    ),
                  )}
                </View>
              </View>
            </Animated.View>
          )}
          {showSearch && (
            <Animated.View style={[staticViewStyle, animatedViewStyle]}>
              <View className='h-full w-full'>
                <SearchPanel
                  wallet={wallet}
                  search={delayedSearch}
                  onSelectAsset={onTokenPress}
                  onSelectResultItem={handleSearchResultPress}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </View>
      <FilterSheet
        isShowing={showFilterSheet}
        blockchain={wallet.blockchain}
        onSelectChain={(chainId) => onChainChange(chainId)}
        onClose={() => setShowFilterSheet(false)}
      />
    </ViewWithInset>
  );
}

function DiscoverTab(props: {
  title: string;
  icon: IconDefinition;
  iconColor: string;
  isSelected: boolean;
  onPress: VoidFunction;
}) {
  const { title, icon, iconColor, isSelected, onPress } = props;
  return (
    <BaseButton onPress={onPress}>
      <View
        className={cn(
          'flex flex-row items-center space-x-2 rounded-xl px-3 py-1.5',
          {
            'bg-card-highlight': isSelected,
            'bg-card': !isSelected,
          },
        )}
      >
        <View
          className='items-center justify-center rounded-full bg-current'
          style={{
            ...withSize(adjust(24, 2)),
            backgroundColor: opacity(iconColor, 10),
          }}
        >
          <FontAwesomeIcon icon={icon} color={iconColor} size={adjust(14, 2)} />
        </View>
        <Text className='text-text-primary text-center text-sm font-medium'>
          {title}
        </Text>
      </View>
    </BaseButton>
  );
}

function TrendingTokenItem(props: {
  token: ITokenDiscoverData;
  showChain: boolean;
  onPress: VoidFunction;
}) {
  const { token, showChain, onPress } = props;
  const {
    address,
    chainId,
    name,
    symbol,
    logoUrl,
    price,
    priceChange1h,
    priceChange24h,
    marketCap,
    liquidity,
    volume1h,
    volume24h,
  } = token;

  return (
    <BaseButton onPress={onPress}>
      <View className='bg-card w-full space-y-3 rounded-2xl px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-3'>
          <CryptoAvatar
            symbol={symbol ?? ''}
            size={adjust(36)}
            url={logoUrl ?? undefined}
            chainId={showChain ? token.chainId : undefined}
          />
          <View className='flex flex-1 flex-col'>
            <View className='flex flex-1 flex-row items-center justify-between'>
              <Text
                className='text-text-primary flex-1 truncate pr-1 text-sm font-medium'
                numberOfLines={1}
              >
                {name || 'Unknown Token'}
              </Text>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {formatMoney(price, NumberType.FiatTokenExactPrice)}
              </Text>
            </View>
            <View className='flex flex-row items-center justify-between'>
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {symbol || formatAddress(address)}
              </Text>
              <View className='flex flex-row items-center space-x-2'>
                <Stat
                  label='1h'
                  value={
                    isNil(priceChange1h)
                      ? '-'
                      : (priceChange1h < 0 ? '-' : '+') +
                        formatPercentage(Math.abs(priceChange1h))
                  }
                  valueColor={
                    isNil(priceChange1h)
                      ? colors.textPrimary
                      : priceChange1h < 0
                      ? colors.failure
                      : colors.success
                  }
                />
                <Stat
                  label='24h'
                  value={
                    isNil(priceChange24h)
                      ? '-'
                      : (priceChange24h < 0 ? '-' : '+') +
                        formatPercentage(Math.abs(priceChange24h))
                  }
                  valueColor={
                    isNil(priceChange24h)
                      ? colors.textPrimary
                      : priceChange24h < 0
                      ? colors.failure
                      : colors.success
                  }
                />
              </View>
            </View>
          </View>
        </View>
        <View className='space-y-1'>
          {chainId === ChainId.Solana && (
            <View className='flex flex-row items-center justify-between'>
              <Stat
                label='Market Cap'
                value={isNil(marketCap) ? '-' : formatMoney(marketCap)}
              />
              <Stat
                label='Volume(1h)'
                value={isNil(volume1h) ? '-' : formatMoney(volume1h)}
              />
            </View>
          )}
          <View className='flex flex-row items-center justify-between'>
            <Stat
              label='Liquidity'
              value={
                isNil(liquidity)
                  ? '-'
                  : formatMoney(liquidity < 0.01 ? 0 : liquidity)
              }
            />
            <Stat
              label='Volume(24h)'
              value={isNil(volume24h) ? '-' : formatMoney(volume24h)}
            />
          </View>
        </View>
      </View>
    </BaseButton>
  );
}

export const Stat = styled(function (props: {
  label: string;
  value: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { label, value, valueColor, style } = props;
  return (
    <View className='flex flex-row space-x-1' style={style}>
      <Text className='text-text-secondary text-xs font-normal'>{label}</Text>
      <Text
        className='text-xs font-normal'
        style={{ color: valueColor ?? colors.textPrimary }}
      >
        {value}
      </Text>
    </View>
  );
});
