import cn from 'classnames';
import { Audio } from 'expo-av';
import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Loadable, VoidPromiseFunction } from '../../../../common/types';
import {
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../../../common/utils/query';
import { adjust, withSize } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { CardErrorState } from '../../../../components/card/card-empty-state';
import { SectionList } from '../../../../components/flashlist/section-list';
import { Image } from '../../../../components/image';
import { SteppedProgressBar } from '../../../../components/quests/progress-bar';
import { IQuestGroupItem } from '../../../../components/quests/quest-item/quest-group';
import { ActionSheet } from '../../../../components/sheet';
import { QuestListItemSkeleton } from '../../../../components/skeleton/list-item';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { SCREEN_WIDTH, colors } from '../../../../design/constants';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import {
  IQuest,
  IQuestIdentifier,
} from '../../../../graphql/client/generated/graphql';
import { useAudioContext } from '../../../../provider/audio';
import { walletDetailBottomTabOffset } from '../../navigation/tab-bar-floating';
import { DoubleChevronButton } from '../nest-home-screen/buttons';
import { CheckInSheetContent } from './checkin';
import { QuestsSheet } from './quests';
import { getQuestGroupsFromQuests } from './utils';

interface QuestSectionProps {
  quests: Loadable<IQuest[]>;
  refreshing: boolean;
  showDailySheet: boolean;
  SectionHeader: React.ReactNode;
  NestInfo: React.ReactNode;
  FeaturedSection: React.ReactNode;
  onClaimQuest: (id: IQuestIdentifier) => Promise<void>;
  onToggleDailyCheckin: (showDailySheet: boolean) => void;
  onAction: (questID: IQuestIdentifier) => void;
  onRefresh: VoidPromiseFunction;
}

export function QuestSection(props: QuestSectionProps) {
  const {
    quests,
    refreshing,
    showDailySheet,
    NestInfo,
    SectionHeader,
    FeaturedSection,
    onClaimQuest,
    onToggleDailyCheckin,
    onAction,
    onRefresh,
  } = props;
  const inset = useSafeAreaInsets();

  const [questsSheetData, setQuestsSheetData] = useState({
    isShowing: false,
    title: '',
    data: [] as IQuest[],
  });

  const { pressSound } = useAudioContext().sounds;

  const questGroups = useMemo(() => {
    return mapLoadable(quests)((quests) =>
      getQuestGroupsFromQuests(quests, false, [
        IQuestIdentifier.ReferralReward,
        IQuestIdentifier.DailyCheckIn,
        IQuestIdentifier.SwapToken,
        IQuestIdentifier.Transaction,
      ]),
    );
  }, [...spreadLoadable(quests)]);

  const handleAction = (id: IQuestIdentifier) => {
    setQuestsSheetData((prev) => ({ ...prev, isShowing: false }));
    onAction(id);
  };

  const handleClaim = async (id: IQuestIdentifier) => {
    setQuestsSheetData((prev) => ({ ...prev, isShowing: false }));
    await onClaimQuest(id);
  };

  //dummyQuestGroupItem is used to fix a bug on IOS where a rerender will cause the scroll size of the list to be incorrect.
  const dummyQuestGroupItem: IQuestGroupItem = {
    quests: [],
    isCollapsed: true,
  };
  const sections = mapLoadable(questGroups)((groups) => [
    {
      title: 'Quests',
      data: [dummyQuestGroupItem, ...groups],
    },
  ]);

  const renderItem = ({
    item,
    index,
  }: {
    item: IQuestGroupItem;
    index: number;
  }) => {
    const targetIndex = Platform.OS === 'web' ? 0 : 1;

    return (
      <View>
        {index === targetIndex && (
          <View className='-mb-3'>{FeaturedSection}</View>
        )}
        <QuestListItem
          quests={item.quests}
          title={item.group?.title ?? 'Onboarding Quests'} //TODO: Maybe we should add a 'group' to the onboarding quests instead of 'grouping' the 'ungrouped' quests
          subtitle={
            item.group?.description ??
            'Learn the basics of Nest Wallet and earn XP!'
          }
          pressSound={pressSound!}
          onPress={(quests, title) =>
            setQuestsSheetData({ isShowing: true, data: quests, title })
          }
        />
      </View>
    );
  };

  const renderSectionHeader = () => {
    return <View>{SectionHeader}</View>;
  };

  const renderListHeader = useCallback(
    () => <View>{NestInfo}</View>,
    [NestInfo],
  );

  return onLoadable(sections)(
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton />
        <QuestListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton fixed />
        <QuestListItemSkeleton fixed />
        <View className='-mt-4 items-center justify-center'>
          <CardErrorState
            title='Unable to get Quests'
            description='Something went wrong trying to get available quests.'
          />
        </View>
      </View>
    ),
    (sections) => (
      <View className='flex flex-1'>
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) =>
            item.group?.id ?? item.quests[0] ? item.quests[0]!.id : 'banner'
          }
          stickySectionHeader={false}
          estimatedItemSize={adjust(64)}
          ListHeaderComponent={renderListHeader}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingBottom: inset.bottom + walletDetailBottomTabOffset,
          }}
        />

        <ActionSheet
          isShowing={showDailySheet}
          onClose={() => onToggleDailyCheckin(false)}
          isDetached={true}
        >
          <CheckInSheetContent
            quest={
              quests.data!.find(
                (quest) => quest.id === IQuestIdentifier.DailyCheckIn,
              )!
            }
            onClose={() => onToggleDailyCheckin(false)}
            onClaim={() => onClaimQuest(IQuestIdentifier.DailyCheckIn)}
          />
        </ActionSheet>

        <ActionSheet
          isShowing={questsSheetData.isShowing}
          isFullHeight={true}
          hasBottomInset={true}
          hasTopInset={true}
          onClose={() =>
            setQuestsSheetData((prev) => ({
              ...prev,
              isShowing: false,
            }))
          }
        >
          <QuestsSheet
            quests={questsSheetData.data}
            title={questsSheetData.title}
            onAction={handleAction}
            onClaim={handleClaim}
            onClose={() =>
              setQuestsSheetData((prev) => ({
                ...prev,
                isShowing: false,
              }))
            }
          />
        </ActionSheet>
      </View>
    ),
  );
}

function QuestListItem(props: {
  quests: IQuest[];
  title: string;
  subtitle: string;
  pressSound: Audio.Sound;
  onPress: (quests: IQuest[], title: string) => void;
}) {
  const { quests, title, subtitle, pressSound, onPress } = props;

  if (quests.length === 0) return null; //See dummyQuestGroupItem comment above

  const isGlowing = quests.some(
    (quest) =>
      quest.claimableXp > 0 ||
      (((quest.id === IQuestIdentifier.MobileDownload &&
        Platform.OS !== 'web') ||
        (quest.id === IQuestIdentifier.ExtensionDownload &&
          Platform.OS === 'web')) &&
        quest.completion < 1),
  );

  const paddingHorizontal = 12;
  const [barWidth, setBarWidth] = useState(
    SCREEN_WIDTH - paddingHorizontal * 2,
  );

  const iconSize = 24;
  const iconsShown = 3;
  const questIcons = quests
    .map((quest) => quest.metadata.image)
    .slice(0, iconsShown);

  const totalStepsCompleted = quests.reduce(
    (total, quest) => total + quest.numCompletions,
    0,
  );
  const totalSteps = quests.reduce(
    (total, quest) => total + quest.maxCompletions,
    0,
  );

  return (
    <BaseButton pressSound={pressSound} onPress={() => onPress(quests, title)}>
      <View className='flex w-full px-4 pt-3'>
        <View
          className='bg-card flex w-full flex-col justify-between rounded-2xl px-4 py-4'
          style={{ paddingHorizontal }}
          onLayout={(e) =>
            setBarWidth(e.nativeEvent.layout.width - paddingHorizontal * 2)
          }
        >
          {isGlowing && (
            <View className='border-background bg-primary absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2' />
          )}

          <View className='flex flex-col space-y-2'>
            <View className='flex w-full flex-row items-center justify-between'>
              <Text className='text-text-primary text-base font-medium'>
                {title}
              </Text>
              <DoubleChevronButton
                backgroundColor={colors.cardHighlight}
                isGlowing={isGlowing}
              />
            </View>
            <Text
              className={cn('text-text-secondary font-normal', {
                'text-sm': Platform.OS === 'web',
                'text-xs': Platform.OS !== 'web',
              })}
            >
              {subtitle}
            </Text>
          </View>

          <View className='flex flex-col space-y-3 pt-3'>
            <View className='flex w-full flex-row items-center'>
              {questIcons.map((icon, index) => (
                <View
                  className='border-card absolute rounded-full border-[3px]'
                  style={{
                    left: index * (iconSize - 4),
                  }}
                  key={index}
                >
                  <Image
                    source={icon}
                    style={[withSize(iconSize), { borderRadius: 9999 }]}
                  />
                </View>
              ))}
              {quests.length - iconsShown > 0 && (
                <View
                  className='border-text-secondary bg-card ml-[72px] flex items-center justify-center rounded-full border'
                  style={withSize(iconSize)}
                >
                  <Text className='text-text-primary text-xs font-normal'>{`${
                    quests.length - iconsShown
                  }+`}</Text>
                </View>
              )}
            </View>

            <View style={{ width: barWidth }}>
              <SteppedProgressBar
                currentStep={totalStepsCompleted}
                steps={totalSteps}
                width={barWidth}
                height={2}
                color={colors.success}
                unfilledColor={colors.cardHighlightSecondary}
                borderRadius={8}
                borderWidth={0}
              />
            </View>
          </View>
        </View>
      </View>
    </BaseButton>
  );
}
