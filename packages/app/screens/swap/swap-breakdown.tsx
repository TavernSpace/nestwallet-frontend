import { faCircle } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { DateTime, Duration } from 'luxon';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import { Platform, View as RNView, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { formatMoney, formatPercentage } from '../../common/format/number';
import { QuestChip } from '../../components/quests/quest-item/quest-chip';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { IQuest, IQuestType } from '../../graphql/client/generated/graphql';

export type SwapVolumeBreakdownProps = {
  quest: IQuest;
  style?: StyleProp<ViewStyle>;
};

export const SwapVolumeBreakdown = styled(function (
  props: SwapVolumeBreakdownProps,
) {
  const { quest, style } = props;

  const [currentDay, setCurrentDay] = useState(DateTime.local().weekday);

  const daysOfWeek =
    Platform.OS === 'web'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const nextTierVolume = quest.subQuests[quest.subQuestIndex + 1]?.volume ?? 0;
  const totalVolume = quest.volume ?? 0;

  const progress =
    nextTierVolume > 0 ? Math.min(totalVolume / nextTierVolume, 1) : 0;

  const duration = quest.group?.endTime
    ? DateTime.fromISO(quest.group?.endTime).diff(DateTime.now())
    : undefined;

  // update date every 5 mins if necessary
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = DateTime.local().weekday;
      if (now !== currentDay) {
        setCurrentDay(now);
      }
    }, 1000 * 60 * 5);

    return () => clearInterval(intervalId);
  }, [currentDay]);

  return (
    <View
      className='flex w-full flex-row items-center justify-between'
      style={style}
    >
      <View className='flex flex-col items-center space-y-2 px-2'>
        <View className='flex w-60 flex-row space-x-1'>
          {quest.type === IQuestType.Weekly
            ? daysOfWeek.map((day, index) => (
                <CalenderCard
                  key={index}
                  day={day}
                  isSelected={currentDay === index + 1}
                />
              ))
            : duration && (
                <QuestChip
                  color={colors.failure}
                  text={
                    duration.toMillis() > 0
                      ? duration.toFormat("d'd' h'h' m'm'")
                      : Duration.fromMillis(0).toFormat("d'd' h'h' m'm'")
                  }
                  size='small'
                  icon={faCircle}
                />
              )}
        </View>
        <View className='flex w-full flex-row justify-center space-x-3'>
          <SwapDetailCard title='Total Swapped' volume={totalVolume} />
          <SwapDetailCard title='Next Tier' volume={nextTierVolume} />
        </View>
      </View>
      <VolumeProgress size={80} strokeWidth={6} progress={progress} />
    </View>
  );
});

const CalenderCard = styled(function (props: {
  day: String;
  isSelected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { day, isSelected, style } = props;

  return (
    <View
      className='bg-card border-card-highlight flex-1 rounded-md border'
      style={style}
    >
      <View className='items-center justify-center p-1'>
        <Text
          className={cn('text-xs font-medium', {
            'text-text-primary': isSelected,
            'text-text-secondary': !isSelected,
          })}
        >
          {day}
        </Text>
      </View>
    </View>
  );
});

function SwapDetailCard(props: { title: string; volume: number }) {
  const { title, volume } = props;
  const displayVolume =
    title === 'Next Tier' && volume === 0 ? '---' : formatMoney(volume);

  return (
    <View className='bg-card flex-1 rounded-xl'>
      <View className='flex flex-col space-y-1 px-3 py-2'>
        <View className='flex flex-row items-center space-x-1'>
          <Text
            className='text-text-secondary text-xs font-normal'
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Text
          className='text-sm font-normal'
          style={{
            color: colors.textPrimary,
          }}
        >
          {displayVolume}
        </Text>
      </View>
    </View>
  );
}

type VolumeProgressProps = {
  size: number;
  strokeWidth: number;
  progress: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
};

const VolumeProgress = styled(function (props: VolumeProgressProps) {
  const { size, strokeWidth, progress, style, color } = props;
  //TODO: for some reason this has to be different than strokeDasharray for the unfilled circle, when size is < 140
  const arcLength = 260;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - progress * circumference * (arcLength / 360);

  const startAngle = 0;
  const endAngle = startAngle + progress * arcLength;
  const radians = endAngle * (Math.PI / 180);

  const endX = size / 2 + radius * Math.cos(radians);
  const endY = size / 2 + radius * Math.sin(radians);
  const sizeWithPadding = size + 10;

  const isMobile = Platform.OS != 'web';

  return (
    <RNView style={style}>
      <Svg height={sizeWithPadding} width={sizeWithPadding}>
        <G
          rotation='-228'
          origin={`${sizeWithPadding / 2}, ${sizeWithPadding / 2}`}
        >
          <Circle
            cx={sizeWithPadding / 2}
            cy={sizeWithPadding / 2}
            r={radius}
            stroke={color ?? colors.cardHighlightSecondary}
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={180}
            strokeLinecap='round'
          />
          <Circle
            cx={sizeWithPadding / 2}
            cy={sizeWithPadding / 2}
            r={radius}
            stroke={color ?? colors.primary}
            strokeWidth={strokeWidth}
            fill='none'
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
          />
          {progress > 0 && (
            <Circle
              cx={endX + 5}
              cy={endY + 5}
              r={strokeWidth - 1}
              fill={colors.primary}
            />
          )}
        </G>
      </Svg>
      <View className='absolute -bottom-1 left-0 right-0 items-center justify-center space-y-6'>
        <Text
          className={cn('text-text-primary text-base font-bold', {
            'text-sm': isMobile,
          })}
        >
          {formatPercentage(progress * 100)}
        </Text>
        <Text
          className={cn('text-text-secondary text-xs font-medium', {
            'text-xss': isMobile,
          })}
        >
          Completed
        </Text>
      </View>
    </RNView>
  );
});
