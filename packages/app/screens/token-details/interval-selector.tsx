import {
  faChartCandlestick,
  faLineChart,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { IChartPeriod } from '../../graphql/client/generated/graphql';
import { ChartType } from './types';
import { candleSupported } from './utils';

export const IntervalSelector = memo(
  styled(function (props: {
    liveSupported: boolean;
    chainId: number;
    period: IChartPeriod | 'live';
    chartType: ChartType;
    disabled?: boolean;
    onPressPeriod: (period: IChartPeriod | 'live') => void;
    onPressChartType: (chartType: ChartType) => void;
    style?: StyleProp<ViewStyle>;
  }) {
    const {
      liveSupported,
      chainId,
      period,
      chartType,
      onPressPeriod,
      onPressChartType,
      style,
      disabled,
    } = props;

    return (
      <View className='flex w-full flex-row space-x-2' style={style}>
        <View className='bg-card flex-1 flex-row justify-between rounded-xl px-2 py-2'>
          {liveSupported && (
            <IntervalSelectorItem
              interval='Live'
              width={48}
              isSelected={period === 'live'}
              onPress={() => onPressPeriod('live')}
            />
          )}
          <IntervalSelectorItem
            interval='H'
            isSelected={period === IChartPeriod.Hour}
            onPress={() => onPressPeriod(IChartPeriod.Hour)}
          />
          <IntervalSelectorItem
            interval='D'
            isSelected={period === IChartPeriod.Day}
            onPress={() => onPressPeriod(IChartPeriod.Day)}
          />
          <IntervalSelectorItem
            interval='W'
            isSelected={period === IChartPeriod.Week}
            onPress={() => onPressPeriod(IChartPeriod.Week)}
          />
          <IntervalSelectorItem
            interval='M'
            isSelected={period === IChartPeriod.Month}
            onPress={() => onPressPeriod(IChartPeriod.Month)}
          />
          <IntervalSelectorItem
            interval='Y'
            isSelected={period === IChartPeriod.Year}
            onPress={() => onPressPeriod(IChartPeriod.Year)}
          />
          <IntervalSelectorItem
            interval='All'
            width={36}
            isSelected={period === IChartPeriod.Max}
            onPress={() => onPressPeriod(IChartPeriod.Max)}
          />
        </View>
        {candleSupported(chainId) && (
          <View>
            <ChartTypeSelector
              isSelected={chartType === 'candle'}
              onPress={() => {
                if (chartType === 'line') {
                  onPressChartType('candle');
                } else {
                  onPressChartType('line');
                }
              }}
            />
          </View>
        )}
      </View>
    );
  }),
  (prev, cur) =>
    prev.liveSupported === cur.liveSupported &&
    prev.period === cur.period &&
    prev.chainId === cur.chainId &&
    prev.chartType === cur.chartType &&
    prev.disabled === cur.disabled,
);

function IntervalSelectorItem(props: {
  interval: string;
  width?: number;
  isSelected: boolean;
  onPress: VoidFunction;
}) {
  const { interval, width = 28, isSelected, onPress } = props;
  return (
    <BaseButton className='overflow-hidden rounded' onPress={onPress}>
      <View
        className={cn('h-6 items-center justify-center rounded-lg', {
          'bg-primary/10': isSelected,
        })}
        style={{ width }}
      >
        <Text
          className={cn('text-sm font-medium', {
            'text-text-secondary': !isSelected,
            'text-primary': isSelected,
          })}
        >
          {interval}
        </Text>
      </View>
    </BaseButton>
  );
}

function ChartTypeSelector(props: {
  isSelected: boolean;
  onPress: VoidFunction;
}) {
  const { isSelected, onPress } = props;

  return (
    <BaseButton onPress={onPress}>
      <View className='bg-card h-10 w-10 items-center justify-center rounded-xl'>
        <FontAwesomeIcon
          icon={!isSelected ? faChartCandlestick : faLineChart}
          size={18}
          color={colors.textSecondary}
        />
      </View>
    </BaseButton>
  );
}
