import { faAnglesRight } from '@fortawesome/pro-regular-svg-icons';
import { faCircle, faHourglassStart } from '@fortawesome/pro-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import XP from '../../../assets/images/xp.svg';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { SCREEN_WIDTH, colors } from '../../../design/constants';
import { aggregateQuestRewards } from '../../../features/quest/utils';
import {
  IQuest,
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

interface QuestItemProps {
  quest: IQuest;
  onClaim: VoidPromiseFunction;
  onAction: VoidFunction;
}

export function QuestItem(props: QuestItemProps) {
  const { onClaim, onAction } = props;
  const [quest, setQuest] = useState(props.quest);
  const [loading, setLoading] = useState(false);

  // https://shopify.github.io/flash-list/docs/recycling
  // we need to reset state when view is recycled
  useEffect(() => {
    if (!_.isEqual(props.quest, quest.id)) {
      setQuest(props.quest);
      setLoading(false);
    }
  }, [props.quest]);

  const completed = quest.completion >= 1 && quest.claimableXp === 0;
  const opacityStyle = completed ? { opacity: 0.5 } : {};
  const barWidth = (SCREEN_WIDTH - 96) / 2;
  const size = adjust(40);
  const resetDuration = quest.resetTime
    ? DateTime.fromISO(quest.resetTime).diff(DateTime.now())
    : undefined;
  const endDuration = quest.endTime
    ? DateTime.fromISO(quest.endTime).diff(DateTime.now())
    : undefined;
  const additionalRewards = aggregateQuestRewards([quest]);

  const handleClaim = async () => {
    try {
      setLoading(true);
      await onClaim();
    } catch {
      // TODO: do we want to show a snackbar here?
    } finally {
      setLoading(false);
    }
  };

  const isDirectClaimable =
    ((quest.id === IQuestIdentifier.MobileDownload && Platform.OS !== 'web') ||
      (quest.id === IQuestIdentifier.ExtensionDownload &&
        Platform.OS === 'web')) &&
    !completed;

  const hasFlag =
    resetDuration || endDuration || quest.metadata.flags.length > 0;

  return (
    <BaseButton onPress={onAction}>
      <View
        className='bg-card flex flex-row items-center justify-between overflow-hidden rounded-xl px-3 py-3'
        style={opacityStyle}
      >
        <View className='flex flex-1 flex-row items-center space-x-4'>
          <View className='flex rounded-lg'>
            <Image
              source={{
                uri: quest.metadata.image,
              }}
              style={withSize(size)}
              className='rounded-lg'
            />
          </View>
          <View className='flex flex-1 flex-col justify-center'>
            <View className='flex flex-col'>
              <View
                className='flex flex-row items-center'
                style={{ width: barWidth }}
              >
                <Text
                  className='text-text-primary truncate text-sm font-bold'
                  numberOfLines={1}
                >
                  {quest.name}
                </Text>
              </View>
              {hasFlag && (
                <View className='flex flex-row space-x-1 pt-1'>
                  {quest.metadata.flags.map((flag) => (
                    <QuestChip
                      key={flag.name}
                      color={flag.color}
                      text={flag.name}
                    />
                  ))}
                  {resetDuration && (
                    <QuestChip
                      color={colors.questTime}
                      text={
                        resetDuration.toMillis() > 0
                          ? resetDuration.toFormat(
                              quest.id === IQuestIdentifier.DailyCheckIn
                                ? "h'h' m'm'"
                                : "d'd' h'h' m'm'",
                            )
                          : Duration.fromMillis(0).toFormat(
                              quest.id === IQuestIdentifier.DailyCheckIn
                                ? "h'h' m'm'"
                                : "d'd' h'h' m'm'",
                            )
                      }
                      icon={faHourglassStart}
                    />
                  )}
                  {endDuration && (
                    <QuestChip
                      color={colors.failure}
                      text={
                        endDuration.toMillis() > 0
                          ? endDuration.toFormat("d'd' h'h' m'm'")
                          : Duration.fromMillis(0).toFormat("d'd' h'h' m'm'")
                      }
                      icon={faCircle}
                    />
                  )}
                </View>
              )}
              {quest.maxCompletions > 1 && (
                <View
                  className={hasFlag ? 'pt-3' : 'pt-2'}
                  style={{ width: barWidth }}
                >
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
          </View>
        </View>
        <View className='flex flex-none flex-row items-center space-x-2'>
          <View className='flex flex-row items-center space-x-1'>
            {quest.id !== IQuestIdentifier.DailyCheckIn &&
              quest.totalPoints > 0 && (
                <View className='flex flex-row'>
                  <Text className='text-text-primary text-sm font-bold'>
                    {quest.totalPoints}
                  </Text>
                  <Svg source={XP} height={12} width={16} />
                </View>
              )}
            {quest.id === IQuestIdentifier.DailyCheckIn && (
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm font-bold'>
                  {
                    quest.subQuests[
                      Math.min(
                        quest.subQuestIndex + 1,
                        quest.subQuests.length - 1,
                      )
                    ]!.points
                  }
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
              <View className='bg-card-highlight flex flex-row items-center justify-center space-x-1.5 rounded-full px-2 py-0.5'>
                <ActivityIndicator
                  size={adjust(12, 2)}
                  color={colors.textSecondary}
                />
                <Text className='text-text-secondary text-xs font-medium'>
                  {'Claiming'}
                </Text>
              </View>
            </BaseButton>
          ) : quest.claimableXp > 0 || isDirectClaimable ? (
            <BaseButton
              onPress={
                quest.id === IQuestIdentifier.DailyCheckIn
                  ? onAction
                  : handleClaim
              }
            >
              <LinearGradient
                colors={[colors.primary, colors.questClaim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 9999,
                }}
              >
                <View className='flex flex-row items-center justify-center space-x-1 rounded-full px-2 py-0.5'>
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
}
