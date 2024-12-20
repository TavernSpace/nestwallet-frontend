import cn from 'classnames';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  formatCrypto,
  formatMoney,
  formatPercentage,
} from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { Loadable } from '../../common/types';
import { spreadLoadable } from '../../common/utils/query';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import {
  ICryptoBalance,
  ITokenMarketDataV2,
} from '../../graphql/client/generated/graphql';
import { useMarketContext } from '../../provider/market';
import { usePositionContext } from '../../provider/position';

export function TokenDetailsHeader(props: {
  token: ICryptoBalance;
  tokenData: Loadable<ITokenMarketDataV2>;
}) {
  const { token, tokenData } = props;
  const { price: livePrice } = useMarketContext();
  const { pnlAt } = usePositionContext();

  const [defaultPrice, defaultPercentage] = useMemo(() => {
    const tokenPrice = parseFloat(token.tokenMetadata.price);
    const price =
      tokenPrice !== 0
        ? tokenPrice
        : tokenData.success
        ? tokenData.data.price ?? 0
        : 0;
    const percentage =
      token.balanceChange.percent1D ||
      tokenData?.data?.stats24h?.priceChange ||
      0;
    return [price, percentage];
  }, [...spreadLoadable(tokenData), token]);

  const price = livePrice || defaultPrice;
  const percentage =
    tokenData.data?.stats24h?.historicalPrice && livePrice
      ? livePrice / tokenData.data.stats24h.historicalPrice - 1
      : defaultPercentage;

  const [absolutePnl, percentagePnl] = pnlAt(price);
  const totalBalance = token.balance;
  const totalBalanceUsd = parseFloat(token.balanceInUSD);

  return (
    <View
      className={cn('mb-1 flex flex-row items-center justify-between px-4', {
        '-mt-2': Platform.OS !== 'web',
        '-mt-3': Platform.OS === 'web',
      })}
    >
      <View className='flex flex-col'>
        <Text className='text-text-primary text-lg font-medium'>
          {formatMoney(price, NumberType.FiatTokenExactPrice)}
        </Text>
        <View className='flex flex-row items-center space-x-1'>
          <Text
            className={cn('text-xs font-normal', {
              'text-failure': percentage < 0,
              'text-success': percentage >= 0,
            })}
          >
            {`${percentage < 0 ? '-' : '+'}${formatPercentage(
              Math.abs(percentage * 100),
            )}`}
          </Text>
        </View>
      </View>
      {totalBalance !== '0' && (
        <View className='flex flex-col items-end'>
          <View className='flex flex-row items-center space-x-1'>
            <View className='bg-card rounded-full px-2 py-0.5'>
              <Text className='text-text-secondary text-xs font-normal'>
                {`${totalBalanceUsd < 0 ? '-' : ''}${formatMoney(
                  Math.abs(totalBalanceUsd),
                )}`}
              </Text>
            </View>
            <Text className='text-text-primary text-sm font-medium'>
              {`${formatCrypto(totalBalance, token.tokenMetadata.decimals)} ${
                token.tokenMetadata.symbol
              }`}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-1'>
            <Text
              className={cn('text-xs font-normal', {
                'text-failure': absolutePnl < 0,
                'text-success': absolutePnl >= 0,
              })}
            >
              {`${absolutePnl >= 0 ? '+' : '-'}${formatMoney(
                Math.abs(absolutePnl),
              )} (${formatPercentage(Math.abs(percentagePnl * 100))})`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
