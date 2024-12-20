import { faHourglassStart } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { DateTime, Duration } from 'luxon';
import { useState } from 'react';
import { VoidPromiseFunction } from '../../../../common/types';
import { adjust } from '../../../../common/utils/style';
import { Button } from '../../../../components/button/button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import {
  ContinuousCheckInCard,
  DailyCheckInCard,
} from '../../../../components/quests/quest-daily-check-in';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { IQuest } from '../../../../graphql/client/generated/graphql';

export function CheckInSheetContent(props: {
  quest: IQuest;
  onClose: VoidFunction;
  onClaim: VoidPromiseFunction;
}) {
  const { quest, onClose, onClaim } = props;

  const [loading, setLoading] = useState(false);

  const currentIndex = Math.min(
    quest.subQuestIndex + 1,
    quest.subQuests.length - 1,
  );
  const isComplete = quest.completion >= 1;
  const resetDuration = quest.resetTime
    ? DateTime.fromISO(quest.resetTime).diff(DateTime.now())
    : undefined;

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

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title='Daily Check In'
        onClose={onClose}
        type='detached'
      />
      <View className='px-4 pb-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          Sign in continuously to get more points
        </Text>
      </View>
      <View>
        <View className='flex w-full flex-row space-x-2 px-4'>
          <DailyCheckInCard
            className='flex-1'
            index={0}
            currentIndex={currentIndex}
            points={10}
            claimable={!isComplete}
          />
          <DailyCheckInCard
            className='flex-1'
            index={1}
            currentIndex={currentIndex}
            points={15}
            claimable={!isComplete}
          />
          <DailyCheckInCard
            className='flex-1'
            index={2}
            currentIndex={currentIndex}
            points={20}
            claimable={!isComplete}
          />
          <DailyCheckInCard
            className='flex-1'
            index={3}
            currentIndex={currentIndex}
            points={20}
            claimable={!isComplete}
          />
        </View>
        <View className='mb-2 mt-4 flex flex-row space-x-2 px-4'>
          <View className='flex flex-1 flex-row space-x-2'>
            <DailyCheckInCard
              className='flex-1'
              index={4}
              currentIndex={currentIndex}
              points={25}
              claimable={!isComplete}
            />
            <DailyCheckInCard
              className='flex-1'
              index={5}
              currentIndex={currentIndex}
              points={25}
              claimable={!isComplete}
            />
          </View>
          <ContinuousCheckInCard
            className='flex-1'
            index={6}
            currentIndex={currentIndex}
            points={30}
            claimable={!isComplete}
          />
        </View>
        <Button
          className='mx-4 mt-4'
          onPress={handleClaim}
          loading={loading}
          disabled={loading || isComplete}
        >
          <View className='flex flex-row items-center space-x-1'>
            {isComplete && (
              <FontAwesomeIcon
                icon={faHourglassStart}
                size={adjust(14, 2)}
                color={colors.textSecondary}
              />
            )}
            <Text
              className={cn('text-sm font-bold', {
                'text-text-button-primary': !isComplete,
                'text-text-secondary': isComplete,
              })}
            >
              {isComplete
                ? `Claimable in ${
                    resetDuration
                      ? resetDuration.toMillis() > 0
                        ? resetDuration.toFormat("h'h' m'm'")
                        : Duration.fromMillis(0).toFormat("h'h' m'm'")
                      : ''
                  }`
                : 'Check-in'}
            </Text>
          </View>
        </Button>
      </View>
    </View>
  );
}
