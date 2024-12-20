import cn from 'classnames';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MintLottie from '../../../../assets/animations/mint/mint-lottie.json';
import EvolveCard from '../../../../assets/images/evolve-card.svg';
import spotlight from '../../../../assets/images/spotlight.png';
import { delay } from '../../../../common/api/utils';
import { adjust } from '../../../../common/utils/style';
import { TextButton } from '../../../../components/button/text-button';
import LottieView from '../../../../components/lottie-view/';
import { useParticleAnimation } from '../../../../components/quests/quest-daily-check-in/utils';
import { Svg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  colors,
} from '../../../../design/constants';
import { getNestNftImage } from '../../../../features/nft/nest/utils';
import { useAudioContext } from '../../../../provider/audio';

interface MintAnimationScreenProps {
  onDismiss: VoidFunction;
}

export function MintAnimationScreen(props: MintAnimationScreenProps) {
  const { onDismiss } = props;

  const { mintNestSound, rewardsBgSound } = useAudioContext().sounds;

  const [totalWidth, setTotalWidth] = useState(SCREEN_WIDTH);
  const [totalHeight, setTotalHeight] = useState(SCREEN_HEIGHT);
  const [showParticles, setShowParticles] = useState(false);
  const [showLottie, setShowLottie] = useState(false); //Sometimes, lottie would misbehave and play again after completed! This will stop that.

  const moveDuration = 2200;
  const dismissDuration = 1000;
  const bottomPadding = adjust(150, 50);
  const originalImageSize = SCREEN_WIDTH / 4 + 8;

  const imageSize = useSharedValue(200);
  const imageOpacity = useSharedValue(0);
  const imageGrowth = 150;
  const imageFinalSize = originalImageSize + imageGrowth;
  const imageTranslationY = useSharedValue(0);

  const spotlightGrowth = 200;
  const spotlightFinalSize = imageFinalSize + spotlightGrowth;
  const spotlightTranslationY = useSharedValue(0);
  const spotlightRotation = useSharedValue(0);

  const flashOpacity = useSharedValue(0);

  const backgroundOpacity = useSharedValue(1);

  const textBlockOpacity = useSharedValue(0);

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: imageSize.value,
      height: imageSize.value,
      opacity: imageOpacity.value,
      transform: [
        {
          translateY: imageTranslationY.value,
        },
      ],
    };
  });

  const animatedSpotlightStyle = useAnimatedStyle(() => {
    return {
      width: spotlightFinalSize,
      height: spotlightFinalSize,
      opacity: textBlockOpacity.value,
      position: 'absolute',
      transform: [
        {
          translateY: spotlightTranslationY.value,
        },
        {
          rotate: `${spotlightRotation.value}deg`,
        },
      ],
    };
  });

  const animatedFlashStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: colors.textPrimary,
      opacity: flashOpacity.value,
      width: totalWidth,
      height: totalHeight,
      position: 'absolute',
    };
  });

  const animatedTextBlockStyle = useAnimatedStyle(() => {
    return {
      opacity: textBlockOpacity.value,
      paddingBottom: bottomPadding,
      height: totalHeight,
      width: totalWidth,
      alignItems: 'center',
      flex: 1,
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: colors.background,
      opacity: backgroundOpacity.value,
      width: totalWidth,
      height: totalHeight,
      position: 'absolute',
    };
  });

  const particles = useParticleAnimation({
    particleAmount: 100,
    particleDelay: 20,
    xMax: 2000,
    xMin: 1000,
    yMax: 2000,
    yMin: 1000,
  });

  const particleStyle = {
    position: 'absolute',
    backgroundColor: colors.send,
    top: '50%',
    left: '50%',
    display: showParticles ? 'flex' : 'none',
  };

  useEffect(() => {
    handleAnimateMint();

    const backSubscription =
      Platform.OS === 'web'
        ? undefined
        : BackHandler.addEventListener('hardwareBackPress', () => {
            handleDismiss();
            return true;
          });

    return () => backSubscription && backSubscription.remove();
  }, []);

  const handleAnimateMint = async () => {
    mintNestSound?.replayAsync();
    await delay(1500);
    setShowLottie(true);

    await delay(2600);

    imageSize.value = withSpring(imageFinalSize * 1.1, {
      damping: 15,
      stiffness: 200,
    });

    imageOpacity.value = withTiming(1, { duration: 100 });
    flashOpacity.value = withTiming(1, { duration: 30 });
    setShowParticles(true);
    setShowLottie(false);
    await delay(60);
    flashOpacity.value = withTiming(0, { duration: 30 });
    await delay(300);
    setShowParticles(false);
    await delay(1000);

    handleMoveNest();
  };

  const handleMoveNest = () => {
    rewardsBgSound?.replayAsync();
    imageTranslationY.value = withTiming(-totalHeight / 4, {
      duration: moveDuration,
      easing: Easing.out(Easing.exp),
    });
    imageSize.value = withTiming(imageFinalSize, {
      duration: moveDuration,
      easing: Easing.out(Easing.exp),
    });

    spotlightTranslationY.value = withTiming(-totalHeight / 4, {
      duration: moveDuration,
      easing: Easing.out(Easing.exp),
    });
    spotlightRotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );

    textBlockOpacity.value = withTiming(1, { duration: moveDuration });
    backgroundOpacity.value = withTiming(0.9, { duration: moveDuration });
  };

  const handleDismiss = async () => {
    imageOpacity.value = withTiming(0, { duration: dismissDuration });
    backgroundOpacity.value = withTiming(0, { duration: dismissDuration });
    textBlockOpacity.value = withTiming(0, { duration: dismissDuration });
    await delay(dismissDuration);
    rewardsBgSound?.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
    onDismiss();
  };

  const renderParticles = () =>
    particles.map((particle, idx) => {
      const size = Math.random() * 4 + 4;
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

  return (
    <View
      className='absolute h-full w-full items-center'
      onLayout={(e) => {
        setTotalWidth(e.nativeEvent.layout.width);
        setTotalHeight(e.nativeEvent.layout.height);
      }}
    >
      <Animated.View style={animatedBackgroundStyle} />
      <Animated.View style={animatedFlashStyle} />
      <View className='h-full w-full items-center justify-center'>
        {showLottie && (
          <LottieView autoplay={true} loop={false} animatedData={MintLottie} />
        )}
        <View className='absolute items-center justify-center'>
          {renderParticles()}

          <Animated.Image source={spotlight} style={animatedSpotlightStyle} />
          <Animated.Image
            style={animatedImageStyle}
            source={{
              uri: getNestNftImage(1, true),
            }}
          />
        </View>

        <Animated.View style={animatedTextBlockStyle}>
          <View className='mt-16 h-full items-center justify-end'>
            <Text className='text-primary text-xl font-medium'>THE NEST</Text>
            <View className='-mt-3 items-center'>
              <Svg
                style={{ borderRadius: 8 }}
                source={EvolveCard}
                width={SCREEN_WIDTH - 32}
                height={(SCREEN_WIDTH - 32) * 0.6}
              />
              <Text
                className={cn(
                  'text-primary/60 absolute mt-10 text-center font-medium',
                  {
                    'px-3 text-sm': Platform.OS === 'web',
                    'px-8 text-xs': Platform.OS !== 'web',
                  },
                )}
              >
                {`In the world of crypto, there exists a unique NFT known as 'The Nest'. While intrinsically tied to Nest Wallet, The Nest isn't just an NFT, it's a living entity that evolves over time...\n \n Venture into The Nest, complete the various quests to level up and gain rewards.`}
              </Text>
            </View>
            <TextButton
              text='Continue'
              className='-mt-3 w-40'
              onPress={handleDismiss}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
