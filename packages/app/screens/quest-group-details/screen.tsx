import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import {
  faCheckCircle,
  faRocketLaunch,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import _ from 'lodash';
import { useState } from 'react';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { QuestChip } from '../../components/quests/quest-item/quest-chip';
import { IQuestGroupItem } from '../../components/quests/quest-item/quest-group';
import { ScrollView } from '../../components/scroll';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import { aggregateQuestRewards } from '../../features/quest/utils';
import { useSafeAreaInsets } from '../../features/safe-area';
import { IQuest, IQuestReward } from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { RewardPill, TotalPointsPill } from '../quest-details/screen';
import { localization } from './localization';

interface QuestGroupDetailsProps {
  questGroupItem: IQuestGroupItem;
  onBack: VoidFunction;
  onClaim: (quest: IQuest) => Promise<void>;
}

export function QuestGroupDetails(props: QuestGroupDetailsProps) {
  const { questGroupItem, onBack, onClaim } = props;
  const { language } = useLanguageContext();
  const { bottom } = useSafeAreaInsets();
  const { showSnackbar } = useSnackbar();

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
  const quests = questGroupItem.quests;
  const complete = !quests.some((quest) => quest.completion < 1);
  const claimable = quests.some((quest) => quest.claimableXp > 0);
  const totalPoints = quests.reduce((sum, quest) => sum + quest.totalPoints, 0);

  const additionalRewards = aggregateQuestRewards(questGroupItem.quests);

  const handleClaim = async () => {
    try {
      setLoadingClaim(true);

      //claim all claimable quests in the group
      const claimableQuests = quests.filter((quest) => quest.claimableXp > 0);
      const claimPromises = claimableQuests.map((quest) => onClaim(quest));

      await Promise.all(claimPromises);
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
              {/* TODO: add banner for questGroup */}
              <Image
                source={{ uri: questGroupItem.group?.banner }}
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
                    source={{ uri: questGroupItem.group?.image }}
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
              {questGroupItem.group?.flags.map((flag) => (
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
              {questGroupItem.group?.title}
            </Text>
            <View className='flex flex-row flex-wrap items-center space-x-1.5 pt-1'>
              <View className='flex flex-row items-center space-x-2 pr-0.5'>
                <FontAwesomeIcon
                  icon={faRocketLaunch}
                  size={adjust(14, 2)}
                  color={colors.textSecondary}
                />
                <Text className='text-text-secondary text-sm font-normal'>
                  {
                    localization.totalQuests(questGroupItem.quests.length)[
                      language
                    ]
                  }
                </Text>
              </View>
              {totalPoints > 0 && <TotalPointsPill totalPoints={totalPoints} />}
              {additionalRewards.map((reward) => (
                <RewardPill key={reward.name} reward={reward} />
              ))}
            </View>
            <View className='mt-4 space-y-2'>
              <Text className='text-text-secondary text-xs font-medium'>
                {localization.subQuests[language]}
              </Text>
            </View>
            {!_.isEmpty(questGroupItem.quests) && (
              <View className='flex flex-col pt-2'>
                {_.map(questGroupItem.quests, (subQuest, index) => (
                  <SubQuestItem
                    key={index}
                    index={index}
                    quests={questGroupItem.quests}
                    totalSubQuests={questGroupItem.quests.length}
                    subQuest={subQuest}
                  />
                ))}
              </View>
            )}
            {!_.isEmpty(questGroupItem.group?.description) && (
              <View>
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
                <View className='space-y-2 py-3'>
                  <Text className='text-text-secondary text-xs font-medium'>
                    {localization.completeAllQuests[language]}
                  </Text>

                  <View className='flex-row justify-between pr-4'>
                    <View>
                      <Text className='text-text-primary w-60 text-xs font-bold'>
                        {questGroupItem.group?.description}
                      </Text>
                    </View>

                    <RewardsCard rewards={additionalRewards} />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        {(!complete || claimable) && (
          <View
            className='mt-2 flex flex-row items-center space-x-4 px-4'
            style={{ paddingBottom: bottom }}
          >
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
  subQuest: IQuest;
  quests: IQuest[];
  index: number;
  totalSubQuests: number;
}) {
  const { subQuest, index, quests, totalSubQuests } = props;
  const isFirst = index === 0;
  const isLast = index === totalSubQuests - 1;
  const isCompleted = subQuest.completion > 0;
  const isNextCompleted = !isLast && quests[index + 1]!.completion > 0;

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
          <Text className='text-text-primary text-sm'>{subQuest.title}</Text>
        </View>
        <View className='flex flex-row items-center space-x-1'>
          {subQuest.totalPoints > 0 && (
            <TotalPointsPill totalPoints={subQuest.totalPoints} />
          )}
        </View>
      </View>
    </View>
  );
}

function RewardsCard(props: { rewards: IQuestReward[] }) {
  const { rewards } = props;

  return (
    <View className='flex flex-row'>
      {rewards.map((reward, index) => (
        <Image
          key={index}
          source={{ uri: reward.image }}
          style={[
            withSize(20),
            {
              position: 'absolute',
              left: index * 15,
              zIndex: rewards.length - index,
            },
          ]}
          className='rounded-full'
        />
      ))}
    </View>
  );
}
