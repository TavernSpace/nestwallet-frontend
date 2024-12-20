import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import {
  faCheck,
  faCheckCircle,
  faGem,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import _, { isNil } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import XP from '../../assets/images/xp.svg';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { QuestChip } from '../../components/quests/quest-item/quest-chip';
import { ScrollView } from '../../components/scroll';
import { Svg } from '../../components/svg';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import { parseError } from '../../features/errors';
import { aggregateQuestRewards } from '../../features/quest/utils';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  IQuest,
  IQuestIdentifier,
  IQuestReward,
  ISubQuest,
} from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { SwapVolumeBreakdown } from '../swap/swap-breakdown';
import { localization } from './localization';

interface QuestDetailsProps {
  quest: IQuest;
  onBack: VoidFunction;
  onAction: (quest: IQuest) => Promise<void>;
  onClaim: (quest: IQuest) => Promise<void>;
  onVerify: (quest: IQuest) => Promise<void>;
}

export function QuestDetails(props: QuestDetailsProps) {
  const { quest, onBack, onAction, onClaim, onVerify } = props;
  const { language } = useLanguageContext();
  const { bottom } = useSafeAreaInsets();
  const { showSnackbar } = useSnackbar();

  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingClaim, setLoadingClaim] = useState(false);

  useNavigationOptions({
    headerShown: true,
    headerTransparent: true,
    headerStyle: undefined,
    headerTitle: '',
    headerLeft: () => (
      <BaseButton onPress={onBack} rippleEnabled={false}>
        <View
          className='items-center justify-center rounded-full'
          style={{
            ...withSize(adjust(24)),
            backgroundColor: opacity(colors.card, 80),
          }}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={adjust(16, 2)}
            color={colors.textPrimary}
          />
        </View>
      </BaseButton>
    ),
    headerRight: () => null,
  });

  // TODO: on sidepanel and ipad, how to prevent image stretch?
  const bannerHeight = SCREEN_WIDTH * 0.4;
  const complete = quest.completion >= 1 && quest.claimableXp === 0;
  const claimable = quest.claimableXp > 0;
  const isDirectClaimable =
    ((quest.id === IQuestIdentifier.MobileDownload && Platform.OS !== 'web') ||
      (quest.id === IQuestIdentifier.ExtensionDownload &&
        Platform.OS === 'web')) &&
    !complete;
  const additionalRewards = aggregateQuestRewards([quest]);

  const handleAction = async () => {
    try {
      setLoadingAction(true);
      await onAction(quest);
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.somethingWentWrong[language],
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoadingVerify(true);
      await onVerify(quest);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyVerifiedQuest[language],
      });
    } catch (err) {
      const error = parseError(err, localization.somethingWentWrong[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleClaim = async () => {
    try {
      setLoadingClaim(true);
      await onClaim(quest);
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.somethingWentWrong[language],
      });
    } finally {
      setLoadingClaim(false);
    }
  };

  return (
    <View className='absolute h-full w-full'>
      <View className='relative flex h-full flex-col justify-between'>
        <ScrollView
          className='flex flex-1 flex-col'
          contentContainerStyle={{ paddingBottom: bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* header */}
          <View className='flex-none'>
            <View>
              <Image
                source={{ uri: quest.metadata.banner }}
                style={{ width: '100%', height: bannerHeight }}
                contentFit='fill'
              />
            </View>
            <LinearGradient
              colors={[
                colors.background,
                colors.questBorder,
                colors.background,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0.01, 0.1, 1]}
              style={{
                height: 1,
                width: '100%',
              }}
            />
            <View className='absolute px-4' style={{ top: bannerHeight - 30 }}>
              <LinearGradient
                colors={[
                  colors.background,
                  colors.questBorder,
                  colors.background,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  ...withSize(64),
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  className='items-center justify-center rounded-full'
                  style={withSize(60)}
                >
                  <Image
                    source={{ uri: quest.metadata.image }}
                    style={withSize(60)}
                    className='rounded-full'
                  />
                </View>
              </LinearGradient>
            </View>
            <View
              className='mt-2 flex flex-row items-center justify-end space-x-2 px-4'
              style={{ minHeight: 12 }}
            >
              {complete && (
                <QuestChip
                  text={localization.complete[language]}
                  color={colors.success}
                  icon={faCheckCircle}
                  size='medium'
                  iconSize={adjust(12, 2)}
                />
              )}
              {quest.metadata.flags.map((flag) => (
                <QuestChip
                  key={flag.name}
                  text={flag.name}
                  color={flag.color}
                  size='medium'
                />
              ))}
            </View>
          </View>

          {/* content */}
          <View className='mt-4 px-4'>
            <Text className='text-text-primary text-lg font-bold'>
              {quest.title}
            </Text>
            <View className='flex flex-row flex-wrap items-center space-x-1.5 pt-1'>
              <View className='flex flex-row items-center space-x-2 pr-0.5'>
                <FontAwesomeIcon
                  icon={faGem}
                  size={adjust(14, 2)}
                  color={colors.textSecondary}
                />
                <Text className='text-text-secondary text-sm font-normal'>
                  {localization.rewardsAvailable[language]}
                </Text>
              </View>
              {quest.totalPoints > 0 && (
                <TotalPointsPill totalPoints={quest.totalPoints} />
              )}
              {additionalRewards.map((reward) => (
                <RewardPill key={reward.name} reward={reward} />
              ))}
            </View>

            {isNil(quest.volume) ||
            quest.subQuests.some((quest) => isNil(quest.volume)) ? (
              <View className='mt-4 space-y-2'>
                <Text className='text-text-secondary text-xs font-medium'>
                  {localization.DESCRIPTION[language]}
                </Text>
                {!_.isEmpty(quest.description) && (
                  <Text className='text-text-primary text-sm font-normal'>
                    {quest.description}
                  </Text>
                )}
              </View>
            ) : (
              <View className='flex items-center justify-center py-4'>
                <SwapVolumeBreakdown quest={quest} />
              </View>
            )}
            {!_.isEmpty(quest.subQuests) && (
              <View className='flex flex-col'>
                {_.map(quest.subQuests, (subQuest, index) => (
                  <SubQuestItem
                    key={index}
                    index={index}
                    currentIndex={quest.subQuestIndex}
                    totalSubQuests={quest.subQuests.length}
                    subQuest={subQuest}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        {(!complete || claimable || isDirectClaimable) && (
          <View
            className='mt-2 flex flex-row items-center space-x-4 px-4'
            style={{ paddingBottom: bottom }}
          >
            {quest.link && (
              <View className='flex-1'>
                <TextButton
                  text={quest.link.title}
                  type='tertiary'
                  onPress={handleAction}
                  loading={loadingAction}
                  disabled={loadingAction}
                />
              </View>
            )}
            <View className='flex-1'>
              {loadingClaim ? (
                <TextButton
                  text={localization.claiming[language]}
                  loading={true}
                  disabled={true}
                />
              ) : claimable ? (
                <BaseButton onPress={handleClaim}>
                  <LinearGradient
                    colors={[colors.primary, colors.questClaim]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 9999,
                    }}
                  >
                    <View
                      className='flex flex-row items-center justify-center rounded-full px-2 py-1'
                      style={{ height: BUTTON_HEIGHT }}
                    >
                      <Text className='text-text-button-primary text-sm font-bold'>
                        {localization.claim[language]}
                      </Text>
                    </View>
                  </LinearGradient>
                </BaseButton>
              ) : quest.isVerifiable ? (
                <TextButton
                  text={localization.verify[language]}
                  onPress={handleVerify}
                  loading={loadingVerify}
                  disabled={loadingVerify}
                />
              ) : (
                <TextButton
                  text={localization.claim[language]}
                  disabled={true}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function SubQuestItem(props: {
  subQuest: ISubQuest;
  index: number;
  currentIndex: number;
  totalSubQuests: number;
}) {
  const { subQuest, index, totalSubQuests, currentIndex } = props;
  const isFirst = index === 0;
  const isLast = index === totalSubQuests - 1;
  const isCompleted = index <= currentIndex;
  const isNextCompleted = index + 1 <= currentIndex;
  return (
    <View className='relative'>
      <View
        className={cn('absolute top-0 h-1/2 border-l', {
          'border-primary': isCompleted,
          'border-card-highlight': !isCompleted,
          hidden: isFirst,
        })}
        style={{ marginLeft: 5 }}
      />
      <View
        className={cn('absolute bottom-0 h-1/2 border-l', {
          'border-primary': isNextCompleted,
          'border-card-highlight': !isNextCompleted,
          hidden: isLast,
        })}
        style={{ marginLeft: 5 }}
      />
      <View className='flex flex-row items-center justify-between pb-3 pt-3'>
        <View className='flex flex-row items-center space-x-3'>
          <View
            className={cn('rounded-full border', {
              'border-primary bg-primary': isCompleted,
              'border-card-highlight bg-card-highlight': !isCompleted,
            })}
            style={{ width: 12, height: 12 }}
          />
          <Text className='text-text-primary text-sm'>
            {subQuest.description}
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-1'>
          {subQuest.points > 0 && (
            <TotalPointsPill
              totalPoints={subQuest.points}
              isCompleted={isCompleted}
            />
          )}
          {subQuest.additionalRewards.map((reward) => (
            <RewardPill key={reward.name} reward={reward} />
          ))}
        </View>
      </View>
    </View>
  );
}

export const TotalPointsPill = styled(function (props: {
  totalPoints: number;
  isCompleted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { totalPoints, isCompleted, style } = props;
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View style={style}>
      {isCompleted && (
        <View
          className='absolute z-10 items-center justify-center '
          style={{ width: size.width, height: size.height }}
        >
          <FontAwesomeIcon icon={faCheck} size={15} color={colors.primary} />
        </View>
      )}

      <View
        className={cn(
          'border-primary flex flex-row items-center space-x-1 rounded-full border px-2 py-0.5',
          { 'bg-card-highlight opacity-30': isCompleted },
        )}
        onLayout={(e) =>
          setSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Text className='text-text-primary text-xs font-medium'>
          +{totalPoints}
        </Text>
        <Svg source={XP} height={10} width={14} />
      </View>
    </View>
  );
});

export const RewardPill = styled(function (props: {
  reward: IQuestReward;
  style?: StyleProp<ViewStyle>;
}) {
  const { reward, style } = props;
  return (
    <View style={style}>
      <View className='border-primary flex flex-row items-center space-x-1 rounded-full border px-2 py-0.5'>
        <Text className='text-text-primary text-xs font-medium'>
          +{reward.amount}
        </Text>
        <Image
          source={{ uri: reward.image }}
          style={withSize(adjust(12, 2))}
          className='rounded-full'
        />
      </View>
    </View>
  );
});
