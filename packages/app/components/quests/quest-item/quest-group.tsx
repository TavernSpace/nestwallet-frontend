import { faAnglesRight } from '@fortawesome/pro-regular-svg-icons';
import {
  faChevronDown,
  faChevronRight,
  faCircle,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime, Duration } from 'luxon';
import { styled } from 'nativewind';
import { useState } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import XP from '../../../assets/images/xp.svg';
import { formatNumber } from '../../../common/format/number';
import { NumberType } from '../../../common/format/types';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { SCREEN_WIDTH, colors } from '../../../design/constants';
import { aggregateQuestRewards } from '../../../features/quest/utils';
import {
  IQuest,
  IQuestGroup,
  IQuestGroupIdentifier,
  IQuestIdentifier,
} from '../../../graphql/client/generated/graphql';
import { ActivityIndicator } from '../../activity-indicator';
import { BaseButton } from '../../button/base-button';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Image } from '../../image';
import { Svg } from '../../svg';
import { Text } from '../../text';
import { View } from '../../view';
import { ProgressBar, SteppedProgressBar } from '../progress-bar';
import { QuestChip } from './quest-chip';

const check =
  'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/check.png';

export interface IQuestGroupItem {
  group?: IQuestGroup;
  quests: IQuest[];
  isCollapsed: boolean;
}

export function QuestGroup(props: {
  group: IQuestGroupItem;
  onClaim: (id: IQuestIdentifier) => Promise<void>;
  onAction: (questID: IQuestIdentifier) => void;
  onGroupAction: (groupID: IQuestGroupIdentifier) => void;
  onPress: VoidFunction;
}) {
  const {
    group: questGroup,
    onClaim,
    onAction,
    onGroupAction,
    onPress,
  } = props;

  const group = questGroup.group!;
  const quests = questGroup.quests;
  const collapsed = questGroup.isCollapsed;

  const completed = !quests.some((quest) => quest.completion < 1);
  const opacityStyle = completed ? { opacity: 0.5 } : {};
  const size = adjust(36);
  const duration = group.endTime
    ? DateTime.fromISO(group.endTime).diff(DateTime.now())
    : undefined;

  return (
    <View className='flex flex-col' style={opacityStyle}>
      <BaseButton
        onPress={onPress}
        animationEnabled={false}
        rippleEnabled={false}
      >
        <View
          className={cn(
            'bg-card flex flex-row items-center justify-between rounded-t-xl px-3 py-3',
            { 'rounded-b-xl': collapsed },
          )}
        >
          <View className='flex flex-row items-center space-x-4'>
            <View className='flex rounded-lg'>
              <Image
                source={{ uri: group.image }}
                style={withSize(size)}
                className='rounded-lg'
              />
            </View>
            <View className='flex flex-col space-y-1'>
              <Text className='text-text-primary text-sm font-bold'>
                {group.title}
              </Text>
              <View className='flex flex-row space-x-1'>
                {group.flags.map((flag) => (
                  <QuestChip
                    key={flag.name}
                    color={flag.color}
                    text={flag.name}
                  />
                ))}
                {duration && (
                  <QuestChip
                    color={colors.failure}
                    text={
                      duration.toMillis() > 0
                        ? duration.toFormat("d'd' h'h' m'm'")
                        : Duration.fromMillis(0).toFormat("d'd' h'h' m'm'")
                    }
                    icon={faCircle}
                  />
                )}
              </View>
            </View>
          </View>
          <View className='flex flex-row items-center space-x-4 px-2'>
            <BaseButton onPress={() => onGroupAction(group.id)}>
              <LinearGradient
                // TODO: add these colors to the config
                colors={['#FF0000', '#C71585', '#FF1493', colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 9999,
                  padding: 1,
                }}
              >
                <View className='bg-card-highlight rounded-full px-2 py-0.5'>
                  <Text className='text-text-primary text-xs font-medium'>
                    Details
                  </Text>
                </View>
              </LinearGradient>
            </BaseButton>

            {completed && (
              <Image
                source={{ uri: check }}
                style={{ width: adjust(12, 2), height: adjust(10, 2) }}
              />
            )}
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronDown}
              color={colors.textSecondary}
              size={adjust(12, 2)}
            />
          </View>
        </View>
      </BaseButton>
      {!collapsed && (
        <View>
          <LinearGradient
            colors={[colors.background, colors.questBorder, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0.01, 0.1, 1]}
            style={{
              height: 1,
              width: '100%',
            }}
          />
          <View className='bg-card flex flex-row rounded-b-xl px-3 pb-4'>
            <View style={{ width: size }}>
              <QuestLine quests={quests} />
            </View>
            <View className='flex flex-1 flex-col pl-4'>
              <RewardsCard group={group} quests={quests} />
              <View className='space-y-4 pt-2.5'>
                {quests.map((quest) => (
                  <GroupQuestItem
                    key={quest.id}
                    quest={quest}
                    onClaim={() => onClaim(quest.id)}
                    onAction={() => onAction(quest.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const GroupQuestItem = styled(function (props: {
  quest: IQuest;
  onClaim: VoidPromiseFunction;
  onAction: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { quest, onClaim, onAction, style } = props;

  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    try {
      setLoading(true);
      await onClaim();
    } catch {
      // TODO: should we show snackbar here?
    } finally {
      setLoading(false);
    }
  };

  const barWidth = (SCREEN_WIDTH - 80) / 2;
  const completed = quest.completion >= 1 && quest.claimableXp === 0;
  const additionalRewards = aggregateQuestRewards([quest]);

  return (
    <BaseButton
      onPress={onAction}
      animationEnabled={false}
      rippleEnabled={false}
      style={style}
    >
      <View className='flex flex-row items-center justify-between'>
        <View
          className='flex h-9 flex-col justify-center space-y-2'
          style={{ width: barWidth }}
        >
          <Text
            className='text-text-primary truncate text-sm font-bold'
            numberOfLines={1}
          >
            {quest.name}
          </Text>
          {quest.maxCompletions > 1 && (
            <View>
              {quest.isContinuous ? (
                <ProgressBar
                  progress={quest.completion}
                  width={barWidth}
                  height={2}
                  color={colors.primary}
                  unfilledColor={colors.cardHighlightSecondary}
                  borderRadius={8}
                  borderWidth={0}
                />
              ) : (
                <SteppedProgressBar
                  currentStep={quest.numCompletions}
                  steps={quest.maxCompletions}
                  width={barWidth}
                  height={2}
                  color={colors.primary}
                  unfilledColor={colors.cardHighlightSecondary}
                  borderRadius={8}
                  borderWidth={0}
                />
              )}
            </View>
          )}
        </View>
        <View className='flex h-9 flex-row items-center space-x-2'>
          <View className='flex flex-row items-center space-x-1'>
            {quest.totalPoints > 0 && (
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm font-bold'>
                  {quest.totalPoints}
                </Text>
                <Svg source={XP} height={12} width={16} />
              </View>
            )}
            {additionalRewards.length > 0 && (
              <View
                className='items-center justify-center'
                style={{
                  width: adjust(14, 2) + (additionalRewards.length - 1) * 6,
                }}
              >
                {additionalRewards.map((reward, index) => (
                  <View
                    key={reward.name}
                    className='absolute'
                    style={{ left: index * 8 }}
                  >
                    <Image
                      source={{
                        uri: reward.image,
                      }}
                      style={withSize(adjust(14, 2))}
                      className='rounded-full'
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
          {loading ? (
            <BaseButton disabled={true}>
              <View className='bg-card-highlight flex flex-row space-x-1 rounded-full px-2 py-0.5'>
                <ActivityIndicator
                  size={adjust(12, 2)}
                  color={colors.textSecondary}
                />
                <Text className='text-text-secondary text-xs font-medium'>
                  {'Claiming'}
                </Text>
              </View>
            </BaseButton>
          ) : quest.claimableXp > 0 ? (
            <BaseButton onPress={handleClaim}>
              <LinearGradient
                colors={[colors.primary, colors.questClaim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 9999,
                }}
              >
                <View className='flex flex-row space-x-1 rounded-full px-2 py-0.5'>
                  <Text className='text-text-button-primary text-xs font-medium'>
                    {'Claim'}
                  </Text>
                </View>
              </LinearGradient>
            </BaseButton>
          ) : completed ? (
            <View className='px-2'>
              <Image
                source={{ uri: check }}
                style={{ width: adjust(12, 2), height: adjust(10, 2) }}
              />
            </View>
          ) : (
            <View className='flex flex-row px-2'>
              <FontAwesomeIcon
                icon={faAnglesRight}
                color={colors.textPrimary}
                size={adjust(12, 2)}
              />
            </View>
          )}
        </View>
      </View>
    </BaseButton>
  );
});

function QuestLine(props: { quests: IQuest[] }) {
  const { quests } = props;
  return (
    <View className='flex flex-col items-center'>
      <View
        className={cn('w-[1px]', {
          'bg-card-highlight-secondary': quests[0]!.completion < 1,
          'bg-primary': quests[0]!.completion >= 1,
          'h-[26px]': Platform.OS === 'web',
          'h-7': Platform.OS !== 'web',
        })}
      />
      {quests.map((quest, index) => {
        const isPreviousComplete =
          index === 0 || quests[index - 1]!.completion >= 1;
        return (
          <View key={index} className='flex flex-col items-center'>
            <View
              className={cn('h-10 w-[1px]', {
                'bg-card-highlight-secondary':
                  quest.completion < 1 || !isPreviousComplete,
                'bg-primary': quest.completion >= 1 && isPreviousComplete,
              })}
            />
            <View
              className={cn('h-3 w-3 rounded-full', {
                'bg-card-highlight-secondary': quest.completion < 1,
                'bg-primary': quest.completion >= 1,
              })}
            />
          </View>
        );
      })}
    </View>
  );
}

function RewardsCard(props: { group: IQuestGroup; quests: IQuest[] }) {
  const { group, quests } = props;

  const xp =
    quests.reduce((acc, cur) => acc + cur.totalPoints, 0) +
    group.additionalPoints;
  const rewards = aggregateQuestRewards(quests, group);

  return (
    <View className='flex flex-row space-x-2'>
      {xp > 0 && (
        <View className='flex flex-col'>
          <View className='bg-card-highlight flex w-8 flex-col items-center justify-center space-y-0.5 pt-1.5'>
            <Svg source={XP} height={12} width={16} />
            <Text className='text-text-primary text-xs font-bold'>{xp}</Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      )}
      {rewards.map((reward) => (
        <View key={reward.name} className='flex flex-col'>
          <View className='bg-card-highlight flex w-8 flex-col items-center justify-center space-y-0.5 pt-1.5'>
            <Image
              source={{ uri: reward.image }}
              style={withSize(12)}
              className='rounded-full'
            />
            <Text className='text-text-primary text-xs font-bold'>
              {formatNumber({
                input: reward.amount,
                currencyCode: undefined,
                type: NumberType.Shorthand,
                placeholder: undefined,
              })}
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      ))}
    </View>
  );
}
