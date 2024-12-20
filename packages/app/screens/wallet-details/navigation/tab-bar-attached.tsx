import {
  faClockNine as faClockNineLight,
  faCompass as faCompassLight,
  faRocketLaunch as faRocketLaunchLight,
  faWallet as faWalletLight,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faClockNine,
  faCompass,
  faRocketLaunch,
  faTelescope,
  faWallet,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Loadable, Tuple } from '../../../common/types';
import { opacity } from '../../../common/utils/functions';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { View } from '../../../components/view';
import { colors, SCREEN_WIDTH } from '../../../design/constants';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useTabBarVisibilityContext } from '../../../provider/tab-bar';
import { EoaProposalStatus } from '../types';
import { WalletDetailsTabParamList } from './types';

export const { plusButtonWidth, tabItemWidth, tabItemHeight } = {
  tabItemHeight: 52,
  tabItemWidth: 56,
  plusButtonWidth: 68,
};

const routes: Tuple<keyof WalletDetailsTabParamList, 5> = [
  'home' as const,
  'transactions' as const,
  'discover' as const,
  'rewards' as const,
  'browser' as const,
];

export const walletDetailBottomTabOffset = tabItemHeight + 24;

export function WalletTabBarAttached(
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
  const { isTabBarHidden } = useTabBarVisibilityContext();
  const { bottom } = useSafeAreaInsets({ bottom: 8 });

  const tabBarTranslation = useSharedValue(200);
  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    bottom: 0,
    transform: [{ translateY: tabBarTranslation.value }],
  }));

  useEffect(() => {
    if (onChangeTab) {
      onChangeTab(state.index);
    }
  }, [state.index]);

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
      <View
        className='border-card-highlight bg-card border-t px-4 pt-2'
        style={{
          width: SCREEN_WIDTH,
          paddingBottom: Math.min(bottom, 24),
        }}
      >
        <View className='flex flex-row items-center justify-between'>
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
            icon={faTelescope}
            selectedIcon={faTelescope}
            iconSize={adjust(20)}
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
                <View className='absolute right-1.5 top-1.5 z-10'>
                  <View className='bg-card h-3 w-3 items-center justify-center rounded-full'>
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
    iconSize = adjust(20, 2),
    index,
    selectedIndex,
    adornment,
    replacement,
    onPress,
    style,
  } = props;

  const selected = index === selectedIndex;

  return (
    <View className='flex-1' style={style}>
      <BaseButton
        className='flex-1 overflow-hidden rounded-2xl'
        onPress={() => onPress(index)}
        rippleEnabled={false}
      >
        <View className='flex flex-row items-center justify-center'>
          <View
            className='flex h-12 w-12 flex-row items-center justify-center rounded-2xl'
            style={{
              backgroundColor: selected
                ? opacity(colors.primary, 10)
                : index === 2
                ? colors.cardHighlight
                : undefined,
            }}
          >
            {replacement ?? (
              <FontAwesomeIcon
                icon={
                  selected
                    ? (selectedIcon as IconDefinition)
                    : (icon as IconDefinition)
                }
                size={iconSize}
                color={selected ? colors.primary : colors.textSecondary}
              />
            )}
            {adornment}
          </View>
        </View>
      </BaseButton>
    </View>
  );
}
