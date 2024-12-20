import {
  faClockNine as faClockNineLight,
  faCompass as faCompassLight,
  faRocketLaunch as faRocketLaunchLight,
  faTelescope as faTelescopeLight,
  faWallet as faWalletLight,
} from '@fortawesome/pro-regular-svg-icons';
import {
  IconDefinition,
  faClockNine,
  faCompass,
  faRocketLaunch,
  faTelescope,
  faWallet,
} from '@fortawesome/pro-solid-svg-icons';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useEffect, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Loadable, Tuple } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { Blur } from '../../../components/blur';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useTabBarVisibilityContext } from '../../../provider/tab-bar';
import { EoaProposalStatus } from '../types';
import { WalletDetailsTabParamList } from './types';

export const { plusButtonWidth, tabItemWidth, tabItemHeight } = {
  tabItemHeight: 40,
  tabItemWidth: 44,
  plusButtonWidth: 56,
};

const routes: Tuple<keyof WalletDetailsTabParamList, 5> = [
  'home' as const,
  'transactions' as const,
  'discover' as const,
  'rewards' as const,
  'browser' as const,
];

export const walletDetailBottomTabOffset = tabItemHeight + 24;

export function WalletTabBarFloating(
  props: MaterialTopTabBarProps & {
    isMinted: boolean;
    totalClaimableQuestsCount: number;
    totalClaimableLootboxesCount: number;
    proposalStatus?: Loadable<EoaProposalStatus>;
    onChangeTab?: (index: number) => void;
  },
) {
  const {
    proposalStatus,
    state,
    navigation,
    isMinted,
    totalClaimableQuestsCount,
    totalClaimableLootboxesCount,
    onChangeTab,
  } = props;
  const { bottom } = useSafeAreaInsets();
  const { isTabBarHidden } = useTabBarVisibilityContext();

  const tabBarTranslation = useSharedValue(200);
  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    bottom,
    transform: [
      {
        translateY: tabBarTranslation.value,
      },
    ],
  }));

  const snapPointsX = useMemo(
    () => [
      tabItemWidth * 0,
      tabItemWidth * 1,
      tabItemWidth * 2,
      tabItemWidth * 3,
      tabItemWidth * 4,
    ],
    [],
  );

  const backgroundOffset = useSharedValue(snapPointsX[state.index]!);
  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: backgroundOffset.value }],
  }));

  useEffect(() => {
    if (onChangeTab) {
      onChangeTab(state.index);
    }
    backgroundOffset.value = withTiming(snapPointsX[state.index]!);
  }, [state.index, snapPointsX]);

  useEffect(() => {
    tabBarTranslation.value = withTiming(isTabBarHidden ? 200 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.exp),
    });
  }, [isTabBarHidden]);

  const handlePress = (index: number) => {
    navigation.navigate(routes[index]!);
  };

  return (
    <Animated.View style={tabBarAnimatedStyle}>
      <Blur className='overflow-hidden rounded-2xl' intensity={12}>
        <View className='border-card-highlight bg-background/30 rounded-2xl border p-1'>
          <Animated.View style={[backgroundStyle]}>
            <View
              className='absolute rounded-xl opacity-20'
              style={{
                width: tabItemWidth,
                height: tabItemHeight,
                backgroundColor: colors.primary,
              }}
            />
          </Animated.View>
          <View className='flex flex-row items-center'>
            <TabBarItem
              icon={faWalletLight}
              selectedIcon={faWallet}
              index={0}
              selectedIndex={state.index}
              onPress={handlePress}
              style={{ width: tabItemWidth, height: tabItemHeight }}
            />
            <TabBarItem
              icon={faClockNineLight}
              selectedIcon={faClockNine}
              index={1}
              selectedIndex={state.index}
              onPress={handlePress}
              style={{ width: tabItemWidth, height: tabItemHeight }}
              replacement={
                !proposalStatus
                  ? undefined
                  : onLoadable(proposalStatus)(
                      () => undefined,
                      () => undefined,
                      ({ hasPendingProposals }) =>
                        hasPendingProposals ? (
                          <ActivityIndicator
                            size={adjust(18, 2)}
                            color={
                              state.index === 1
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                        ) : undefined,
                    )
              }
            />
            <TabBarItem
              icon={faTelescopeLight}
              selectedIcon={faTelescope}
              iconSize={22}
              index={2}
              selectedIndex={state.index}
              onPress={handlePress}
              style={{ width: tabItemWidth, height: tabItemHeight }}
            />
            <TabBarItem
              icon={faRocketLaunchLight}
              selectedIcon={faRocketLaunch}
              index={3}
              selectedIndex={state.index}
              onPress={handlePress}
              style={{ width: tabItemWidth, height: tabItemHeight }}
              adornment={
                !isMinted ||
                totalClaimableQuestsCount > 0 ||
                totalClaimableLootboxesCount > 0 ? (
                  <View className='absolute -right-2 -top-2 z-10'>
                    <View className='bg-background h-3 w-3 items-center justify-center rounded-full'>
                      <View className='bg-primary h-2 w-2 rounded-full' />
                    </View>
                  </View>
                ) : undefined
              }
            />
            <TabBarItem
              icon={faCompassLight}
              selectedIcon={faCompass}
              index={4}
              selectedIndex={state.index}
              onPress={handlePress}
              style={{ width: tabItemWidth, height: tabItemHeight }}
            />
          </View>
        </View>
      </Blur>
    </Animated.View>
  );
}

function TabBarItem(props: {
  icon: IconDefinition;
  selectedIcon: IconDefinition;
  iconSize?: number;
  index: number;
  selectedIndex: number;
  onPress: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  adornment?: React.ReactElement;
  replacement?: React.ReactElement;
}) {
  const {
    icon,
    selectedIcon,
    iconSize = adjust(18, 2),
    index,
    selectedIndex,
    adornment,
    replacement,
    onPress,
    style,
  } = props;

  return (
    <BaseButton
      className='overflow-hidden rounded-xl'
      onPress={() => onPress(index)}
      rippleEnabled={false}
    >
      <View
        className='flex flex-row items-center justify-center rounded-xl'
        style={style}
      >
        <View className='relative'>
          {replacement ?? (
            <FontAwesomeIcon
              icon={
                index === selectedIndex
                  ? (selectedIcon as IconDefinition)
                  : (icon as IconDefinition)
              }
              size={iconSize}
              color={
                index === selectedIndex ? colors.primary : colors.textSecondary
              }
            />
          )}
          {adornment}
        </View>
      </View>
    </BaseButton>
  );
}
