import { faClone, faQuestion } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../common/format/address';
import {
  formatCryptoFloat,
  formatMoney,
  formatPercentage,
} from '../../common/format/number';
import { useCopy } from '../../common/hooks/copy';
import { Loadable, Nullable } from '../../common/types';
import { onLoadable } from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { getChainInfo } from '../../features/chain';
import {
  ICryptoBalance,
  ITokenMarketDataV2,
  ITokenMarketTimedStats,
} from '../../graphql/client/generated/graphql';
import { useInjectionContext } from '../../provider/injection';
import { useMarketContext } from '../../provider/market';
import { TokenDetailsHeader } from './price-header';

export function OverviewSection(props: {
  token: ICryptoBalance;
  tokenData: Loadable<ITokenMarketDataV2>;
}) {
  const { token, tokenData } = props;
  const { Injection } = useInjectionContext<{ id: string }>();

  return (
    <View className='flex flex-col'>
      <TokenDetailsHeader token={token} tokenData={tokenData} />
      <Injection id={`${token.address}:${token.chainId}`} />
      {onLoadable(tokenData)(
        () => (
          <View
            className={cn('flex flex-col space-y-2 px-4', {
              '-mt-2': Platform.OS === 'web',
              '-mt-4': Platform.OS !== 'web',
            })}
          >
            <Skeleton width={'100%'} borderRadius={16} height={adjust(52)} />
            <Skeleton width={'100%'} borderRadius={16} height={adjust(48)} />
            <Skeleton width={'100%'} borderRadius={16} height={160} />
          </View>
        ),
        () => (
          <View
            className={cn('px-4', {
              '-mt-2': Platform.OS === 'web',
              '-mt-4': Platform.OS !== 'web',
            })}
          >
            <View className='bg-card h-40 w-full items-center justify-center rounded-2xl'>
              <View className='bg-primary/10 h-12 w-12 items-center justify-center rounded-full'>
                <FontAwesomeIcon
                  icon={faQuestion}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View className='mt-3 flex flex-col items-center justify-center'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'No Market Data Found'}
                </Text>
                <Text className='text-text-secondary text-xs font-normal'>
                  {`We couldn't find detailed market data for this token.`}
                </Text>
              </View>
            </View>
          </View>
        ),
        (data) => (
          <View
            className={cn('flex flex-col space-y-2', {
              '-mt-2': Platform.OS === 'web',
              '-mt-4': Platform.OS !== 'web',
            })}
          >
            <MarketInfo marketData={data} />
            <TokenDetails token={token} marketData={data} />
          </View>
        ),
      )}
    </View>
  );
}

const TokenDetails = styled(function (props: {
  token: ICryptoBalance;
  marketData: ITokenMarketDataV2;
  style?: StyleProp<ViewStyle>;
}) {
  const { token, marketData, style } = props;
  const { copy } = useCopy('Copied address!');

  const chainInfo = getChainInfo(token.chainId);

  return (
    <View
      className='bg-card mx-4 flex flex-col space-y-2 rounded-2xl px-4 py-3'
      style={style}
    >
      <Text className='text-text-primary text-base font-medium'>
        Token Details
      </Text>
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <Text className='text-text-secondary text-sm font-normal'>
            {'Name'}
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <Text className='text-text-primary text-sm font-normal'>
            {token.tokenMetadata.name}
          </Text>
        </View>
      </View>
      {!token.tokenMetadata.isNativeToken && (
        <View className='flex flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'Address'}
            </Text>
          </View>
          <BaseButton onPress={() => copy(token.address)}>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={faClone}
                size={adjust(14, 2)}
                color={colors.textSecondary}
              />
              <Text className='text-text-primary text-sm font-normal'>
                {formatAddress(token.address)}
              </Text>
            </View>
          </BaseButton>
        </View>
      )}
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <Text className='text-text-secondary text-sm font-normal'>
            {'Network'}
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <ChainAvatar chainInfo={chainInfo} size={adjust(14, 2)} />
          <Text className='text-text-primary text-sm font-normal'>
            {chainInfo.name}
          </Text>
        </View>
      </View>
      {!isNil(marketData.holders) &&
        marketData.holders > 0 &&
        !token.tokenMetadata.isNativeToken && (
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <Text className='text-text-secondary text-sm font-normal'>
                {'Holders'}
              </Text>
            </View>
            <View className='flex flex-row items-center space-x-2'>
              <Text className='text-text-primary text-sm font-normal'>
                {marketData.holders}
              </Text>
            </View>
          </View>
        )}
      {!isNil(marketData.stats24h?.volume) && (
        <View className='flex flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'24h Volume'}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-normal'>
              {formatMoney(marketData.stats24h!.volume)}
            </Text>
          </View>
        </View>
      )}
      {!isNil(marketData.totalSupply) && marketData.totalSupply > 0 && (
        <View className='flex flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'Total Supply'}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-normal'>
              {`${formatCryptoFloat(marketData.totalSupply)} ${
                token.tokenMetadata.symbol
              }`}
            </Text>
          </View>
        </View>
      )}
      {marketData.tokenCreationTime && !token.tokenMetadata.isNativeToken && (
        <View className='flex flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'Creation Date'}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-normal'>
              {DateTime.fromISO(marketData.tokenCreationTime).toRelative()}
            </Text>
          </View>
        </View>
      )}
      {marketData.poolCreationTime && !token.tokenMetadata.isNativeToken && (
        <View className='flex flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'Pool Created'}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-normal'>
              {DateTime.fromISO(marketData.poolCreationTime).toRelative()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

const MarketInfo = styled(function (props: {
  marketData: ITokenMarketDataV2;
  style?: StyleProp<ViewStyle>;
}) {
  const { marketData, style } = props;
  const { price } = useMarketContext();

  const marketCap =
    marketData.circulatingSupply && price
      ? price * marketData.circulatingSupply
      : marketData.marketCap;
  const fullyDiluted =
    marketData.totalSupply && price
      ? price * marketData.totalSupply
      : marketData.fullyDilutedValuation;
  const liquidity = marketData.liquidity;

  return (
    <View className='mx-4 flex flex-col space-y-2' style={style}>
      <View className='flex flex-row space-x-2'>
        <MarketCard
          className='flex-1'
          title='Market Cap'
          body={formatMoney(marketCap)}
        />
        <MarketCard
          className='flex-1'
          title='FDV'
          body={formatMoney(fullyDiluted)}
        />
        <MarketCard
          className='flex-1'
          title='Liquidity'
          body={formatMoney(liquidity)}
        />
      </View>
      <View className='flex flex-row space-x-2'>
        <ChangeCard
          className='flex-1'
          title='1h'
          price={price}
          stats={marketData.stats1h}
        />
        <ChangeCard
          className='flex-1'
          title='4h'
          price={price}
          stats={marketData.stats4h}
        />
        <ChangeCard
          className='flex-1'
          title='12h'
          price={price}
          stats={marketData.stats12h}
        />
        <ChangeCard
          className='flex-1'
          title='24h'
          price={price}
          stats={marketData.stats24h}
        />
      </View>
    </View>
  );
});

const MarketCard = styled(function (props: {
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, body, style } = props;

  return (
    <View
      className='bg-card flex flex-col items-center justify-center rounded-2xl py-2'
      style={style}
    >
      <Text className='text-text-secondary text-xs font-normal'>{title}</Text>
      <Text
        className={cn('truncate text-sm font-medium', {
          'text-text-secondary': body === '-',
          'text-text-primary': body !== '-',
        })}
        numberOfLines={1}
      >
        {body}
      </Text>
    </View>
  );
});

const ChangeCard = styled(function (props: {
  title: string;
  stats: Nullable<ITokenMarketTimedStats>;
  price: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, stats, price, style } = props;

  const priceChange =
    stats && stats.historicalPrice && price
      ? (price / stats.historicalPrice - 1) * 100
      : stats && !isNil(stats.priceChange)
      ? stats.priceChange * 100
      : undefined;
  const positive = isNil(priceChange) ? true : priceChange >= 0;

  return (
    <View
      className='bg-card flex flex-col items-center justify-center rounded-2xl py-2'
      style={style}
    >
      <Text className='text-text-secondary text-xs font-normal'>{title}</Text>
      <Text
        className={cn('truncate text-xs font-normal', {
          'text-success': positive,
          'text-failure': !positive,
        })}
        numberOfLines={1}
      >
        {`${positive ? '' : '-'}${formatPercentage(
          !isNil(priceChange) ? Math.abs(priceChange) : undefined,
        )}`}
      </Text>
    </View>
  );
});
