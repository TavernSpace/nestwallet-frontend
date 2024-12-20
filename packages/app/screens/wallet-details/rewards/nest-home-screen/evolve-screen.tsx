import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import EvolveCard from '../../../../assets/images/evolve-card.svg';
import Spotlight from '../../../../assets/images/spotlight.png';
import { delay } from '../../../../common/api/utils';
import { adjust } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { IconButton } from '../../../../components/button/icon-button';
import { Svg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { SCREEN_WIDTH, colors } from '../../../../design/constants';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import { useAudioContext } from '../../../../provider/audio';
import { EvolveSheet } from './evolve-sheet';

interface EvolveScreenProps {
  nestImageSource: string;
  nestImageSize: number;
  totalWidth: number;
  totalHeight: number;
  canEvolve?: boolean;
  onDismiss: VoidFunction;
}

export function EvolveScreen(props: EvolveScreenProps) {
  const {
    nestImageSource,
    nestImageSize,
    totalWidth,
    totalHeight,
    canEvolve,
    onDismiss,
  } = props;
  const [showEvolveSheet, setShowEvolveSheet] = useState(false);

  const { pressSound } = useAudioContext().sounds;

  const { top } = useSafeAreaInsets();

  const animationDuration = 1500;
  const dismissDuration = animationDuration / 2;

  const bottomPadding = adjust(150, 50);
  const buttonGradient = canEvolve
    ? [colors.primary, colors.questClaim]
    : [colors.cardHighlight, colors.cardHighlight];

  const imageGrowth = 150;
  const imageFinalSize = nestImageSize + imageGrowth;
  const imageInitialOffset = nestImageSize / 2;
  const imageFinalOffset = imageFinalSize / 2;
  const imageSize = useSharedValue(nestImageSize);
  const imageTranslationX = useSharedValue(totalWidth / 2 - imageInitialOffset);
  const imageTranslationY = useSharedValue(16 + top);

  const spotlightGrowth = 200;
  const spotlightFinalSize = imageFinalSize + spotlightGrowth;
  const spotlightOffset = spotlightFinalSize / 2;
  const spotlightTranslationX = useSharedValue(totalWidth - spotlightOffset);
  const spotlightTranslationY = useSharedValue(0);
  const spotlightRotation = useSharedValue(0);

  const textBlockOpacity = useSharedValue(0);

  useEffect(() => {
    handleMoveNest();

    const backSubscription =
      Platform.OS === 'web'
        ? undefined
        : BackHandler.addEventListener('hardwareBackPress', () => {
            handleDismiss();
            return true;
          });

    return () => backSubscription && backSubscription.remove();
  }, [totalWidth, totalHeight]);

  const handleMoveNest = () => {
    imageTranslationX.value = withTiming(totalWidth / 2 - imageFinalOffset, {
      duration: animationDuration,
      easing: Easing.out(Easing.exp),
    });
    imageTranslationY.value = withTiming(
      totalHeight / 2 + -150 - imageFinalOffset,
      {
        duration: animationDuration,
        easing: Easing.out(Easing.exp),
      },
    );
    imageSize.value = withTiming(imageFinalSize, {
      duration: animationDuration,
      easing: Easing.out(Easing.exp),
    });

    spotlightTranslationX.value = withTiming(totalWidth / 2 - spotlightOffset, {
      duration: animationDuration,
      easing: Easing.out(Easing.exp),
    });
    spotlightTranslationY.value = withTiming(
      totalHeight / 2 + -150 - spotlightOffset,
      {
        duration: animationDuration,
        easing: Easing.out(Easing.exp),
      },
    );
    spotlightRotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );

    textBlockOpacity.value = withTiming(1, { duration: animationDuration });
  };

  const handleDismiss = async () => {
    imageTranslationX.value = withTiming(totalWidth / 2 - imageInitialOffset, {
      duration: dismissDuration,
      easing: Easing.out(Easing.exp),
    });
    imageTranslationY.value = withTiming(16 + top, {
      duration: dismissDuration,
      easing: Easing.out(Easing.exp),
    });
    imageSize.value = withTiming(nestImageSize, {
      duration: dismissDuration,
      easing: Easing.out(Easing.exp),
    });
    textBlockOpacity.value = withTiming(0, { duration: dismissDuration / 3 });
    await delay(dismissDuration / 3);
    onDismiss();
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: imageSize.value,
      height: imageSize.value,
      borderRadius: 16,
      transform: [
        {
          translateX: imageTranslationX.value,
        },
        {
          translateY: imageTranslationY.value,
        },
      ],
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

  const animatedSpotlightStyle = useAnimatedStyle(() => {
    return {
      width: spotlightFinalSize,
      height: spotlightFinalSize,
      opacity: textBlockOpacity.value,
      position: 'absolute',
      transform: [
        {
          translateX: spotlightTranslationX.value,
        },
        {
          translateY: spotlightTranslationY.value,
        },
        {
          rotate: `${spotlightRotation.value}deg`,
        },
      ],
    };
  });
  return (
    <View className='absolute h-full w-full'>
      <View className='bg-background absolute h-full w-full opacity-90' />
      <View
        className='absolute z-10 w-full items-end pr-2.5'
        style={{ top: Platform.OS === 'web' ? 16 : top }}
      >
        <IconButton
          icon={faTimes}
          color={colors.textPrimary}
          pressSound={pressSound}
          size={adjust(20)}
          onPress={handleDismiss}
        />
      </View>
      <View>
        <Animated.Image source={Spotlight} style={animatedSpotlightStyle} />
        <Animated.Image
          source={{
            uri: nestImageSource,
          }}
          style={animatedImageStyle}
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
          <BaseButton
            className='-mt-3'
            pressSound={pressSound}
            onPress={() => setShowEvolveSheet(true)}
            disabled={!canEvolve}
          >
            <LinearGradient
              colors={buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 9999,
                marginTop: -10,
                opacity: canEvolve ? 1 : 0.9,
              }}
            >
              <View className='h-10 w-40 items-center justify-center rounded-full text-xs font-bold'>
                <Text
                  className={cn('text-sm font-bold', {
                    'text-text-button-primary': canEvolve,
                    'text-text-secondary': !canEvolve,
                  })}
                >
                  Evolve
                </Text>
              </View>
            </LinearGradient>
          </BaseButton>
        </View>
      </Animated.View>
      <EvolveSheet
        isShowing={showEvolveSheet}
        onClose={() => setShowEvolveSheet(false)}
      />
    </View>
  );
}
