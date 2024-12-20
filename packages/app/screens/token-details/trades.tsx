import { faArrowRightArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { DateTime } from 'luxon';
import { styled } from 'nativewind';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { formatAddress } from '../../common/format/address';
import { formatCryptoFloat, formatMoney } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { adjust, withSize } from '../../common/utils/style';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { FlatList } from '../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { useDimensions } from '../../features/dimensions';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  ICryptoBalance,
  IRealTimeTokenTradeData,
} from '../../graphql/client/generated/graphql';
import { useMarketContext } from '../../provider/market';

export const TradesSection = memo(function (props: {
  token: ICryptoBalance;
  hideActions: boolean;
  offset: number;
}) {
  const { token, hideActions, offset } = props;
  const { trades } = useMarketContext();
  const { bottom, top } = useSafeAreaInsets();
  const { height } = useDimensions();

  const chainInfo = useMemo(() => getChainInfo(token.chainId), []);
  const validTrades = useMemo(() => trades.slice(-100).reverse(), [trades]);

  const TradeListItem = useCallback(
    (props: { item: IRealTimeTokenTradeData }) => {
      const { item } = props;
      return <TradeItem token={token} item={item} />;
    },
    [token],
  );

  const extractor = useCallback(
    (item: IRealTimeTokenTradeData, index: number) => {
      const prefix = trades.length - index;
      return `${prefix}:${item.tx}`;
    },
    [trades.length],
  );

  const listHeight = useMemo(() => {
    const buttonOffset = hideActions ? 0 : BUTTON_HEIGHT + 8;
    const tradeHeaderHeight = adjust(58);
    return height - top - tradeHeaderHeight - buttonOffset;
  }, [hideActions]);

  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: 16,
      paddingBottom: offset + bottom + 16,
    }),
    [offset],
  );

  const cardHeight = 198 + adjust(40, 40);

  return token.chainId !== ChainId.Solana ? (
    <View
      className='bg-card mx-4 items-center justify-center space-y-3 overflow-hidden rounded-2xl px-4'
      style={{ height: cardHeight }}
    >
      <View
        className='bg-primary/10 items-center justify-center rounded-full'
        style={withSize(48)}
      >
        <FontAwesomeIcon
          icon={faArrowRightArrowLeft}
          size={24}
          color={colors.primary}
        />
      </View>
      <View className='flex flex-col'>
        <Text className='text-text-primary text-center text-sm font-medium'>
          {'Network not Supported'}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {`Live trade tracking is currently not available on ${chainInfo.name}.`}
        </Text>
      </View>
    </View>
  ) : trades.length === 0 ? (
    <View className='flex w-full flex-col space-y-2 px-4'>
      <View className='bg-card h-20 w-full rounded-xl' />
      <View className='bg-card h-20 w-full rounded-xl' />
      <View className='bg-card h-20 w-full rounded-xl' />
    </View>
  ) : (
    <View className='-mt-2 px-4' style={{ height: listHeight }}>
      <FlatList
        data={validTrades}
        renderItem={TradeListItem}
        keyExtractor={extractor}
        ItemSeparatorComponent={Seperator}
        estimatedItemSize={80}
        contentContainerStyle={contentContainerStyle}
      />
    </View>
  );
});

function TradeItem(props: {
  token: ICryptoBalance;
  item: IRealTimeTokenTradeData;
}) {
  const { token, item } = props;

  const buy = item.type === 'buy';

  return (
    <Animated.View entering={FadeInLeft.duration(500)}>
      <View className='bg-card rounded-xl px-4 py-3'>
        <View className='flex flex-col space-y-2'>
          <View className='flex flex-row items-center justify-between space-x-2'>
            <Text
              className={cn('text-xs font-medium', {
                'text-success': buy,
                'text-failure': !buy,
              })}
            >
              {`${buy ? '+' : '-'}${formatCryptoFloat(item.tokenAmount)} ${
                token.tokenMetadata.symbol
              }`}
            </Text>
            <View className='flex-1 items-end'>
              <Text
                className='text-text-secondary truncate text-end text-xs font-normal'
                numberOfLines={1}
              >
                {`Maker `}
                <Text className='text-text-primary text-xs font-medium'>
                  {formatAddress(item.maker)}
                </Text>
              </Text>
            </View>
          </View>
          <View className='flex flex-row items-center justify-between'>
            <Text className='text-text-secondary text-xs font-normal'>
              {`${formatMoney(
                item.priceUSD * item.tokenAmount,
              )} @ ${formatMoney(
                item.priceUSD,
                NumberType.FiatTokenExactPrice,
              )}`}
            </Text>
            <TimeText time={parseInt(item.date)} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function Seperator() {
  return <View className='h-2' />;
}

const TimeText = memo(
  styled(function (props: { time: number; style?: StyleProp<TextStyle> }) {
    const { time, style } = props;

    const [text, setText] = useState(DateTime.fromSeconds(time).toRelative());

    useEffect(() => {
      const date = DateTime.fromSeconds(time);
      setText(date.toRelative());
      const interval = setInterval(() => {
        setText(date.toRelative());
      }, 1000);
      return () => clearInterval(interval);
    }, [time]);

    return (
      <Text className='text-text-secondary text-xs font-normal' style={style}>
        {text}
      </Text>
    );
  }),
  (prev, cur) => prev.time === cur.time,
);
