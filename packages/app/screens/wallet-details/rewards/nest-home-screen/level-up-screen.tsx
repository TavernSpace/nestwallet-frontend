import cn from 'classnames';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LevelUpLottie from '../../../../assets/animations/level-up-lottie.json';
import { delay } from '../../../../common/api/utils';
import { adjust } from '../../../../common/utils/style';
import { TextButton } from '../../../../components/button/text-button';
import LottieView from '../../../../components/lottie-view';
import { useParticleAnimation } from '../../../../components/quests/quest-daily-check-in/utils';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  colors,
} from '../../../../design/constants';
import { adjustTextStyle } from '../../../../design/utils';
import { useAudioContext } from '../../../../provider/audio';

interface LevelUpScreenProps {
  level: number;
  onDismiss: VoidFunction;
}

export function LevelUpScreen(props: LevelUpScreenProps) {
  const { level, onDismiss } = props;

  const { levelUpSound, rewardsBgSound } = useAudioContext().sounds;

  const [totalWidth, setTotalWidth] = useState(SCREEN_WIDTH);
  const [totalHeight, setTotalHeight] = useState(SCREEN_HEIGHT);
  const [showParticles, setShowParticles] = useState(false);

  const levelNumberAndButtonOpacity = useSharedValue(0);
  const levelNumberShadowRadius = useSharedValue(0);

  const textMargin = adjust(180, 40);
  const textScale = useSharedValue(0);

  const particles = useParticleAnimation({
    particleAmount: 100,
    xMax: 1000,
    xMin: 500,
    yMax: 1000,
    yMin: 500,
  });

  const animatedLevelNumberStyle = useAnimatedStyle(() => {
    return {
      opacity: levelNumberAndButtonOpacity.value,
      position: 'absolute',
      textShadowColor: Platform.OS === 'web' ? colors.primary : undefined, //Weird mobile bug with RN-reanimated
      textShadowRadius: levelNumberShadowRadius.value,
      textShadowOffset: {
        width: 0,
        height: 0,
      },
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      marginTop: textMargin,
      alignItems: 'center',
      transform: [{ scale: textScale.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      bottom: 30,
      alignItems: 'center',
      position: 'absolute',
      opacity: levelNumberAndButtonOpacity.value,
    };
  });

  const particleStyle = {
    position: 'absolute',
    backgroundColor: colors.warning,
    top: '50%',
    left: '50%',
    display: showParticles ? 'flex' : 'none',
  };

  const textBaseStyle = adjustTextStyle({
    color: colors.primary,
    textAlign: 'center',
    justifyContent: 'center',
    fontSize: 96,
    lineHeight: 1,
    fontWeight: '500',
    textShadowColor: colors.primary,
  });

  useEffect(() => {
    handleAnimateLevelUp();

    const backSubscription =
      Platform.OS === 'web'
        ? undefined
        : BackHandler.addEventListener('hardwareBackPress', () => {
            handleDismiss();
            return true;
          });

    return () => backSubscription && backSubscription.remove();
  }, [totalWidth, totalHeight]);

  const renderParticles = () =>
    particles.map((particle, idx) => {
      const size = Math.random() * 2 + 2;
      const animatedStyle = useAnimatedStyle(() => ({
        opacity: particle.opacity.value,
        transform: [
          { translateX: particle.translateX.value },
          { translateY: particle.translateY.value },
        ],
        width: size,
        height: size,
        borderRadius: size,
      }));

      return (
        <Animated.View
          key={idx}
          style={[particleStyle as StyleProp<ViewStyle>, animatedStyle]}
        />
      );
    });

  const handleAnimateLevelUp = async () => {
    levelUpSound?.replayAsync();
    rewardsBgSound?.replayAsync();
    await delay(1000);
    levelNumberAndButtonOpacity.value = withTiming(1, { duration: 1200 });
    await delay(500);
    setShowParticles(true);
    await delay(500);
    textScale.value = withTiming(1, {
      duration: 300,
      easing: Easing.bounce,
    });
    levelNumberShadowRadius.value = withTiming(4, { duration: 1000 });
  };

  const handleDismiss = () => {
    rewardsBgSound?.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    onDismiss();
  };

  return (
    <View
      className='absolute h-full w-full items-center justify-center'
      onLayout={(e) => {
        setTotalWidth(e.nativeEvent.layout.width);
        setTotalHeight(e.nativeEvent.layout.height);
      }}
    >
      <View className='bg-background/90 absolute h-full w-full' />
      <View className='h-full w-full items-center justify-center'>
        {renderParticles()}
        <View
          className={cn('absolute items-center justify-center', {
            '-mt-20': Platform.OS === 'web',
          })}
        >
          <View
            className={cn({
              'h-52 w-52': Platform.OS !== 'web',
              'h-60 w-60': Platform.OS === 'web',
            })}
          >
            <LottieView
              autoplay={true}
              loop={false}
              animatedData={LevelUpLottie}
            />
          </View>
          <Animated.Text
            allowFontScaling={false}
            style={[
              //Seems to be a bug with RN-Reanimated on mobile. You have to pass textShadowColor in seperately. It will throw a warning otherwise
              animatedLevelNumberStyle,
              textBaseStyle,
            ]}
          >
            {level}
          </Animated.Text>
        </View>
        <Animated.View style={animatedTextStyle}>
          <View className='mt-20 flex flex-col items-center justify-center space-y-2'>
            <Text className='text-text-primary w-full text-center text-3xl font-medium'>
              Level Up!
            </Text>
            <View className='bg-card mx-4 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                Continue leveling up to evolve and gain benefits!
              </Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View style={animatedButtonStyle}>
          <TextButton
            className='w-full px-4'
            text='Continue'
            onPress={handleDismiss}
          />
        </Animated.View>
      </View>
    </View>
  );
}
