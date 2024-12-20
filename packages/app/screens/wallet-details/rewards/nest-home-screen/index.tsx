import { faClipboardList } from '@fortawesome/pro-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Image as RNImage } from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import ether3d from '../../../../assets/images/ether-3d.png';
import rewardDecoration from '../../../../assets/images/rewards-decoration.png';
import sol3d from '../../../../assets/images/sol-3d.png';
import xpSvg from '../../../../assets/images/xp.svg';
import { formatNumber } from '../../../../common/format/number';
import { NumberType } from '../../../../common/format/types';
import { Loadable, VoidPromiseFunction } from '../../../../common/types';
import { opacity } from '../../../../common/utils/functions';
import { onLoadable } from '../../../../common/utils/query';
import { adjust, withSize } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { RefreshButton } from '../../../../components/button/refresh-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Image } from '../../../../components/image';
import { Skeleton } from '../../../../components/skeleton';
import { Svg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  colors,
} from '../../../../design/constants';
import { refreshHapticAsync } from '../../../../features/haptic';
import { getNestNftImage } from '../../../../features/nft/nest/utils';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import {
  ILevelInfo,
  IQuest,
  IQuestEventInfo,
  IQuestGroupIdentifier,
  IQuestIdentifier,
  IReferral,
  IUser,
} from '../../../../graphql/client/generated/graphql';
import { useAudioContext } from '../../../../provider/audio';
import { WindowType, useNestWallet } from '../../../../provider/nestwallet';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { calculateTotals } from '../../../referral-details/utils';
import { QuestSection } from '../quest-section';
import { EvolveScreen } from './evolve-screen';
import {
  RewardsCheckinPanel,
  RewardsLootboxPanel,
  RewardsReferralPanel,
} from './panels';
import { SemiCircleProgressBar } from './progress';

interface NestHomeProps {
  user: IUser;
  quests: Loadable<IQuest[]>;
  referrals: Loadable<IReferral[]>;
  eventInfo: Loadable<IQuestEventInfo[]>;
  levelInfo: Loadable<ILevelInfo>;
  onClaimQuest: (id: IQuestIdentifier) => Promise<void>;
  onQuestAction: (questID: IQuestIdentifier) => void;
  onQuestGroupAction: (groupID: IQuestGroupIdentifier) => void;
  onNavigateRewards: VoidFunction;
  onNavigateReferral: VoidFunction;
  onRefreshQuest: VoidPromiseFunction;
}

export function NestHome(props: NestHomeProps) {
  const {
    user,
    quests,
    referrals,
    levelInfo,
    onRefreshQuest,
    onClaimQuest,
    onQuestAction,
    onQuestGroupAction,
    onNavigateRewards,
    onNavigateReferral,
  } = props;
  //const { copy } = useCopy('Copied referral code!'); TODO: Do we want to display referral code on front page again?
  const { windowType } = useNestWallet();
  const { showSnackbar } = useSnackbar();
  const { top } = useSafeAreaInsets();

  const { pressSound } = useAudioContext().sounds;

  const [showDailySheet, setShowDailySheet] = useState(false);
  const [showEvolveScreen, setShowEvolveScreen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [width, setWidth] = useState(SCREEN_WIDTH);
  const [height, setHeight] = useState(SCREEN_HEIGHT);

  const nestEvolutionTier = 1; //Temporary until evolution is properly implemented
  const userLevel = levelInfo.data?.level ?? 0;
  const xpNeeded = levelInfo.data?.xpNeeded ?? 0;
  const xpEarned = levelInfo.data?.xpEarned ?? 0;

  // later we need to also check what nest they currently are at
  const levelsAwayFromEvolution = userLevel >= 5 ? 0 : 5 - (userLevel % 5);

  const nestImageSize = adjust(130, -10);
  const nestImageTranslationY = useSharedValue(0);
  const bounceDistance = 5;
  const bounceDuration = 1200;

  const progress = xpEarned / xpNeeded;

  const animatedNestImageStyle = useAnimatedStyle(() => {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [
        {
          translateY: nestImageTranslationY.value,
        },
      ],
    };
  });

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await onRefreshQuest();
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to refresh quests',
      });
    }
    setRefreshing(false);
  };

  const handleAnimateImage = () => {
    nestImageTranslationY.value = withRepeat(
      withTiming(bounceDistance, {
        duration: bounceDuration,
      }),
      -1,
      true,
    );
  };

  useEffect(() => {
    //May not work on IOS/simulator
    //Preloads the image for the evolve screen
    const preloadNestImage = async () => {
      await RNImage.prefetch(getNestNftImage(nestEvolutionTier, true)).catch(
        () => {},
      );
    };
    handleAnimateImage();
    preloadNestImage();
  }, []);

  const NestInfo = useMemo(() => {
    return (
      <LinearGradient
        className='flex w-full flex-col items-center justify-end'
        style={{ height: 224 + adjust(24, 2) + Math.max(top, 16) }}
        colors={[colors.background, '#314c9f', colors.background]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <LinearGradient
          className='absolute h-full w-full'
          colors={['#00000030', colors.background]} //Gradient from transparent black to background color.
        />
        <View
          className='flex h-full w-full flex-col space-y-4'
          style={{ paddingTop: Math.max(top, 16) }}
        >
          <Text className='text-text-primary text-center text-base font-medium'>
            {'Rewards Center'}
          </Text>
          <View className='flex w-full'>
            <View className='-ml-2'>
              <SemiCircleProgressBar
                width={SCREEN_WIDTH - 32} // Intentional that width does not scale when stretched on sidebar
                height={200}
                strokeWidth={7}
                progress={progress}
                startColor={colors.primary}
                endColor={colors.approve}
              />
            </View>
            <View className='absolute flex h-full w-full flex-col items-center justify-center'>
              <BaseButton
                pressSound={pressSound}
                onPress={() => {
                  setShowEvolveScreen(true);
                }}
              >
                <Animated.View style={animatedNestImageStyle}>
                  {/* Cool way to make a halo/glow effect */}
                  <Image
                    style={withSize(
                      nestImageSize + (Platform.OS === 'web' ? 3 : 10),
                    )}
                    source={getNestNftImage(1, true)}
                    blurRadius={Platform.OS === 'web' ? 4 : 10}
                  />

                  <Image
                    style={[withSize(nestImageSize), { position: 'absolute' }]}
                    source={getNestNftImage(1, true)}
                  />
                </Animated.View>
              </BaseButton>

              <View className='flex flex-row items-center space-x-2'>
                <Text className='text-text-primary text-lg font-medium'>{`${xpEarned}/${xpNeeded}`}</Text>
                <View className='bg-primary/10 items-center justify-center rounded-full px-2.5 py-0.5'>
                  <Text className='text-primary text-sm font-medium'>{`Lvl. ${userLevel}`}</Text>
                </View>
              </View>
              <Text className='text-text-secondary mt-0.5 text-xs font-normal'>
                {levelsAwayFromEvolution > 0
                  ? `${levelsAwayFromEvolution} Levels until next evolution`
                  : 'Evolution Ready!'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }, [user.referralCode, userLevel, xpEarned, xpNeeded, width]);

  const RewardsBreakdown = onLoadable(referrals)(
    () => (
      <View className='mt-2 flex h-24 w-full items-center justify-center rounded-2xl pb-3'>
        <Skeleton
          className='bg-card rounded-2xl px-5'
          height={90}
          width={width - 40}
        />
      </View>
    ),
    () => null,
    (referrals) => {
      const { totalEvmEarnings, totalSvmEarnings } = calculateTotals(referrals);

      return (
        <View className='h-[90px] w-full px-4 pb-3'>
          <View className='bg-card flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl px-4 py-3.5'>
            <View className='absolute right-0 top-0 opacity-30'>
              <Image
                source={rewardDecoration}
                style={{ width: 112, height: 75 }}
              />
            </View>
            <Text className='text-text-secondary text-sm font-medium'>
              Reward Summary
            </Text>
            <View className='flex flex-row items-center space-x-2'>
              <View className='flex flex-row items-center space-x-1'>
                <Svg source={xpSvg} width={24} height={18} />
                <Text className='text-text-primary text-base font-medium'>
                  {user.pointsBalance}
                </Text>
              </View>

              {totalEvmEarnings > 0 && (
                <View className='flex flex-row space-x-2'>
                  <View className='flex flex-row items-center space-x-2'>
                    <Image source={ether3d} style={withSize(20)} />
                    <Text className='text-text-primary text-base font-medium'>
                      {formatNumber({
                        input: totalEvmEarnings,
                        type: NumberType.TokenNonTx,
                      })}
                    </Text>
                  </View>
                </View>
              )}

              {totalSvmEarnings > 0 && (
                <View className='flex flex-row items-center space-x-2'>
                  <View className='flex flex-row items-center space-x-2'>
                    <Image source={sol3d} style={withSize(20)} />
                    <Text className='text-text-primary text-base font-medium'>
                      {formatNumber({
                        input: totalSvmEarnings,
                        type: NumberType.TokenNonTx,
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
  );

  const FeaturedSection = (
    <View className='flex flex-1 flex-col px-4 pb-3'>
      <View className='flex-col justify-center space-y-3'>
        <View className='flex w-full flex-row items-center justify-center'>
          <RewardsLootboxPanel
            width={width / 2.3}
            //TODO: Uncomment to re-enable rewards
            // isGlowing={lootboxes.data?.some(
            //   (lootbox) => lootbox.status === ILootboxStatus.Confirmed,
            // )}
            isGlowing={false}
            onPress={onNavigateRewards}
          />
          <View className='flex flex-col items-end justify-center space-y-2'>
            <View>
              <RewardsReferralPanel
                width={width / 2.25}
                isGlowing={quests.data?.some(
                  (quest) =>
                    quest.id === IQuestIdentifier.ReferralReward &&
                    quest.claimableXp > 0,
                )}
                onPress={onNavigateReferral}
              />
            </View>
            <View>
              <RewardsCheckinPanel
                width={width / 2.2}
                isGlowing={quests.data?.some(
                  (quest) =>
                    quest.id === IQuestIdentifier.DailyCheckIn &&
                    quest.completion <= 0,
                )}
                onPress={() => setShowDailySheet(true)}
              />
            </View>
          </View>
        </View>
        <View className='flex-row items-center justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <View
              className='items-center justify-center rounded-full'
              style={{
                ...withSize(adjust(26)),
                backgroundColor: opacity(colors.questTime, 20),
              }}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                color={colors.questTime}
                size={adjust(16, 2)}
              />
            </View>
            <Text className='text-text-primary text-base font-medium'>
              Quests
            </Text>
          </View>
          <View className='flex flex-row items-center justify-center space-x-2'>
            <RefreshButton
              pressSound={pressSound}
              onPress={handleRefresh}
              refreshing={refreshing}
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View
      className='h-full w-full justify-start'
      onLayout={
        windowType === WindowType.sidepanel
          ? (e) => {
              setWidth(e.nativeEvent.layout.width);
              setHeight(e.nativeEvent.layout.height);
            }
          : undefined
      }
    >
      <View className='flex h-full w-full flex-1 flex-col'>
        <QuestSection
          quests={quests}
          refreshing={refreshing}
          showDailySheet={showDailySheet}
          NestInfo={NestInfo}
          SectionHeader={RewardsBreakdown}
          FeaturedSection={FeaturedSection}
          onRefresh={handleRefresh}
          onClaimQuest={onClaimQuest}
          onToggleDailyCheckin={setShowDailySheet}
          onAction={onQuestAction}
        />
      </View>
      {showEvolveScreen && (
        <Portal>
          <EvolveScreen
            nestImageSource={getNestNftImage(1, true)}
            nestImageSize={nestImageSize}
            canEvolve={levelsAwayFromEvolution === 0}
            totalWidth={width}
            totalHeight={height}
            onDismiss={() => {
              setShowEvolveScreen(false);
            }}
          />
        </Portal>
      )}
    </View>
  );
}
