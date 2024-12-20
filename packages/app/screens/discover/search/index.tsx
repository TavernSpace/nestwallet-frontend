import { isNil } from 'lodash';
import { memo } from 'react';
import { Platform } from 'react-native';
import { formatAddress } from '../../../common/format/address';
import { formatMoney, formatPercentage } from '../../../common/format/number';
import { NumberType } from '../../../common/format/types';
import {
  makeLoadable,
  onLoadable,
  useLoadDataFromQuery,
} from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { CardErrorState } from '../../../components/card/card-empty-state';
import { FlatList } from '../../../components/flashlist/flat-list';
import { Skeleton } from '../../../components/skeleton';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors, SCREEN_HEIGHT } from '../../../design/constants';
import { swapSupportedChainsForBlockchain } from '../../../features/chain';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { SwappableTokens } from '../../../features/swap/types';
import {
  ICryptoBalance,
  ITokenSearchResultOverview,
  IWallet,
  useTokenSearchQuery,
} from '../../../graphql/client/generated/graphql';
import { AssetSelect } from '../../../molecules/select/asset-select';
import { Stat } from '../screen';

export const SearchPanel = memo(
  function (props: {
    wallet: IWallet;
    search: string;
    onSelectAsset: (asset: ICryptoBalance) => void;
    onSelectResultItem: (token: ITokenSearchResultOverview) => void;
  }) {
    const { wallet, search, onSelectAsset, onSelectResultItem } = props;
    const { bottom } = useSafeAreaInsets();
    const parsedPhrase = search.trim();

    const tokenSearchQuery = useTokenSearchQuery(
      {
        input: {
          blockchain: wallet.blockchain,
          phrase: parsedPhrase,
        },
      },
      { enabled: parsedPhrase.length > 1, staleTime: 60 * 1000 },
    );

    const searchResults = useLoadDataFromQuery(
      tokenSearchQuery,
      (data) => data.tokenSearch as ITokenSearchResultOverview[],
    );

    return onLoadable(
      parsedPhrase.length < 2 ? makeLoadable([]) : searchResults,
    )(
      () => (
        <View className='flex h-full w-full flex-1 flex-col space-y-3 px-4'>
          <View className='space-y-3'>
            <Skeleton width='100%' height={adjust(120)} borderRadius={16} />
            <Skeleton width='100%' height={adjust(120)} borderRadius={16} />
            <Skeleton width='100%' height={adjust(120)} borderRadius={16} />
            <Skeleton width='100%' height={adjust(120)} borderRadius={16} />
          </View>
        </View>
      ),
      () => (
        <View className='flex h-full w-full flex-1 flex-col space-y-3 px-4'>
          <View className=' flex flex-col'>
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
                title='Unable to get search results'
                description='Something went wrong trying to get search results.'
              />
            </View>
          </View>
        </View>
      ),
      (searchResults) =>
        parsedPhrase.length < 2 ? (
          <View className='flex h-full w-full flex-1 flex-col space-y-3 px-4'>
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
        ) : searchResults.length === 0 ? (
          <View
            className='flex h-full w-full flex-1 flex-col'
            style={{ marginTop: -16 }}
          >
            <AssetSelect
              blockchain={wallet.blockchain}
              cryptos={makeLoadable<SwappableTokens>([])}
              onChange={(asset) => onSelectAsset(asset as ICryptoBalance)}
              chainIdOverride={wallet.chainId}
              estimatedHeight={SCREEN_HEIGHT}
              chains={swapSupportedChainsForBlockchain[wallet.blockchain]}
              searchUnknown={true}
              search={search}
              searchColor={colors.cardHighlight}
              hideNFTs={true}
              maxItems={100}
            />
          </View>
        ) : (
          <View className='flex h-full w-full flex-1 flex-col space-y-3 px-4'>
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <TokenSearchResultItem
                  token={item}
                  onPress={() => onSelectResultItem(item)}
                />
              )}
              estimatedItemSize={120}
              ItemSeparatorComponent={() => <View className='h-3' />}
              contentContainerStyle={{
                paddingBottom: Platform.OS === 'web' ? 92 : bottom + 64,
              }}
              keyExtractor={(item) =>
                `${item.metadata.address}:${item.chainId}`
              }
            />
          </View>
        ),
    );
  },
  (prev, cur) =>
    prev.wallet.id === cur.wallet.id &&
    prev.search === cur.search &&
    prev.onSelectAsset === cur.onSelectAsset &&
    prev.onSelectResultItem === cur.onSelectResultItem,
);

export function TokenSearchResultItem(props: {
  token: ITokenSearchResultOverview;
  onPress: VoidFunction;
}) {
  const { token, onPress } = props;
  const {
    chainId,
    metadata,
    price,
    volume1h,
    volume24h,
    liquidity,
    priceChange1h,
    priceChange24h,
    marketCap,
  } = token;

  return (
    <BaseButton onPress={onPress}>
      <View className='bg-card w-full space-y-3 rounded-2xl px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-3'>
          <CryptoAvatar
            chainId={chainId}
            symbol={metadata.symbol}
            size={adjust(36)}
            url={metadata.imageUrl}
          />
          <View className='flex flex-1 flex-col'>
            <View className='flex flex-1 flex-row items-center justify-between'>
              <Text
                className='text-text-primary flex-1 truncate pr-1 text-sm font-medium'
                numberOfLines={1}
              >
                {metadata.name || 'Unknown Token'}
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
                {metadata.symbol || formatAddress(metadata.address)}
              </Text>
              <View className='flex flex-row items-center space-x-2'>
                <Stat
                  label='1h'
                  value={
                    isNil(priceChange1h)
                      ? '-'
                      : (priceChange1h < 0 ? '-' : '+') +
                        formatPercentage(Math.abs(priceChange1h * 100))
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
                        formatPercentage(Math.abs(priceChange24h * 100))
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
          <View className='flex flex-row items-center justify-between'>
            <Stat
              label='Liquidity'
              value={formatMoney(liquidity < 0.01 ? 0 : liquidity)}
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
