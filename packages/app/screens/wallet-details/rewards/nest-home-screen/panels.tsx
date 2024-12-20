import cn from 'classnames';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';
import checkinDecoration from '../../../../assets/images/checkin-icon-decoration.svg';
import checkinIcon from '../../../../assets/images/checkin-icon.png';
import lootboxIcon from '../../../../assets/images/lootbox-icon.png';
import referralDecoration from '../../../../assets/images/referral-icon-decoration.svg';
import referralIcon from '../../../../assets/images/referral-icon.png';
import { delay } from '../../../../common/api/utils';
import { BaseButton } from '../../../../components/button/base-button';
import { Svg as ImageSvg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { useAudioContext } from '../../../../provider/audio';
import { DoubleChevronButton } from './buttons';

const handleHoverIn = (scale: SharedValue<number>, sound: Audio.Sound) => {
  sound.replayAsync();
  scale.value = withTiming(1.05, {
    duration: 200,
    easing: Easing.out(Easing.exp),
  });
};

const handleHoverOut = (scale: SharedValue<number>) => {
  scale.value = withTiming(1, {
    duration: 200,
    easing: Easing.out(Easing.exp),
  });
};

const bounceImage = async (translationY: SharedValue<number>) => {
  translationY.value = withTiming(-10, {
    duration: 300,
  });
  await delay(400);
  translationY.value = withTiming(0, {
    duration: 400,
    easing: Easing.bounce,
  });
  await delay(1200);
};

export function RewardsLootboxPanel(props: {
  width: number;
  isGlowing?: boolean;
  onPress: VoidFunction;
}) {
  const { width, isGlowing, onPress } = props;

  const originalWidth = 163;
  const originalHeight = 168;
  const scaleX = width / originalWidth;

  //The Nest Wallet 'portal' makes this panel a lot more complicated. It needs to be inside the yellow 'shape' so we can't overlay it as an absolute <Image/>
  const { hoverSound1, pressSound } = useAudioContext().sounds;

  const scale = useSharedValue(1);
  const imageTranslationY = useSharedValue(0);

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      width,
      height: originalHeight,
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: 158,
      height: 139,
      overflow: 'hidden',
      position: 'absolute',
      right: -10,
      bottom: -30,
      transform: [{ translateY: imageTranslationY.value }],
    };
  });

  useEffect(() => {
    let isMounted = true;

    const startAnimationLoop = async () => {
      while (isMounted) {
        await bounceImage(imageTranslationY);
      }
    };

    if (isGlowing) startAnimationLoop();

    return () => {
      isMounted = false;
    };
  }, [isGlowing]);

  return (
    <BaseButton
      onPress={onPress}
      pressSound={pressSound}
      onHoverIn={() => handleHoverIn(scale, hoverSound1!)}
      onHoverOut={() => handleHoverOut(scale)}
    >
      <Animated.View style={animatedViewStyle}>
        <Svg
          width={width}
          height={originalHeight}
          viewBox={`0 0 ${width} ${originalHeight}`}
          fill='none'
        >
          <Path
            d={`M0 12C0 5.37259 5.37258 0 12 0H${150.264 * scaleX}C${
              157.172 * scaleX
            } 0 ${162.654 * scaleX} 5.81745 ${162.243 * scaleX} 12.713L${
              153.672 * scaleX
            } 156.713C${153.295 * scaleX} 163.052 ${148.044 * scaleX} 168 ${
              141.693 * scaleX
            } 168H12C5.37258 168 0 162.627 0 156V12Z`}
            fill='url(#paint0_linear_11578_5390)'
          />
          <Mask
            id='mask0_11578_5390'
            maskUnits='userSpaceOnUse'
            x='0'
            y='0'
            width={163 * scaleX}
            height={168}
          >
            <Path
              d={`M0 12C0 5.37259 5.37258 0 12 0H${150.264 * scaleX}C${
                157.172 * scaleX
              } 0 ${162.654 * scaleX} 5.81745 ${162.243 * scaleX} 12.713L${
                153.672 * scaleX
              } 156.713C${153.295 * scaleX} 163.052 ${148.044 * scaleX} 168 ${
                141.693 * scaleX
              } 168H12C5.37258 168 0 162.627 0 156V12Z`}
              fill='url(#paint1_linear_11578_5390)'
            />
          </Mask>
          <G mask='url(#mask0_11578_5390)'>
            <G opacity='0.1'>
              <Path
                fillRule='evenodd'
                clipRule='evenodd'
                d={`M${41.7329 * scaleX} 112.178C${41.7329 * scaleX} 72.7209 ${
                  15.4609 * scaleX
                } 48.0312 ${-8.68467 * scaleX} 48.0312C${
                  -32.8303 * scaleX
                } 48.0312 ${-59.1022 * scaleX} 72.7209 ${
                  -59.1022 * scaleX
                } 112.178C${-59.1022 * scaleX} 151.634 ${
                  -32.8303 * scaleX
                } 176.324 ${-8.68467 * scaleX} 176.324L${
                  -8.68468 * scaleX
                } 226.389C${-67.7865 * scaleX} 226.389 ${
                  -109 * scaleX
                } 171.225 ${-109 * scaleX} 112.178C${-109 * scaleX} 53.1297 ${
                  -67.7865 * scaleX
                } -2.03424 ${-8.68466 * scaleX} -2.03424C${
                  50.4172 * scaleX
                } -2.03424 ${91.6307 * scaleX} 53.1297 ${
                  91.6307 * scaleX
                } 112.178H${41.7329 * scaleX}Z`}
                fill='url(#paint2_linear_11578_5390)'
              />
              <Path
                fillRule='evenodd'
                clipRule='evenodd'
                d={`M${24.2624 * scaleX} 91.7776C${24.2624 * scaleX} 131.084 ${
                  50.5343 * scaleX
                } 155.68 ${74.6799 * scaleX} 155.68C${
                  98.8255 * scaleX
                } 155.68 ${125.097 * scaleX} 131.084 ${
                  125.097 * scaleX
                } 91.7776C${125.097 * scaleX} 52.4709 ${
                  98.8255 * scaleX
                } 27.8751 ${74.6799 * scaleX} 27.8751V${-22 * scaleX}C${
                  133.782 * scaleX
                } -22 ${174.995 * scaleX} 32.9542 ${174.995 * scaleX} 91.7776C${
                  174.995 * scaleX
                } 150.601 ${133.782 * scaleX} 205.555 ${
                  74.6799 * scaleX
                } 205.555C${15.578 * scaleX} 205.555 ${
                  -25.6354 * scaleX
                } 150.601 ${-25.6354 * scaleX} 91.7776L${
                  24.2624 * scaleX
                } 91.7776Z`}
                fill='url(#paint3_linear_11578_5390)'
              />
            </G>
          </G>
          <Defs>
            <LinearGradient
              id='paint0_linear_11578_5390'
              x1='3'
              y1='6.5'
              x2={144 * scaleX}
              y2='168'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#513500' />
              <Stop offset='1' stopColor='#D19727' />
            </LinearGradient>
            <LinearGradient
              id='paint1_linear_11578_5390'
              x1='4.6424'
              y1='15.5'
              x2={154.523 * scaleX}
              y2='171.67'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#211B26' />
              <Stop offset='1' stopColor='#EEF455' />
            </LinearGradient>
            <LinearGradient
              id='paint2_linear_11578_5390'
              x1='32.9976'
              y1={-22 * scaleX}
              x2='32.9976'
              y2='226.389'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#D9D9D9' />
              <Stop offset='1' stopColor='#FDBD3F' />
            </LinearGradient>
            <LinearGradient
              id='paint3_linear_11578_5390'
              x1='32.9976'
              y1={-22 * scaleX}
              x2='32.9976'
              y2='226.389'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#D9D9D9' />
              <Stop offset='1' stopColor='#FDBD3F' />
            </LinearGradient>
          </Defs>
        </Svg>

        {isGlowing && (
          <View className='border-background bg-primary absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2' />
        )}

        <View
          className='pointer-events-none absolute left-0 h-full w-[97%] overflow-hidden'
          pointerEvents='none'
        >
          <Animated.Image source={lootboxIcon} style={animatedImageStyle} />

          <DoubleChevronButton
            className='absolute bottom-1.5 left-3'
            backgroundColor={'#BA9426'}
            isGlowing={isGlowing}
          />

          <View
            className={cn('absolute left-3 flex flex-col', {
              'top-1.5': Platform.OS === 'web',
              'top-1': Platform.OS !== 'web',
            })}
          >
            <Text
              className={cn('text-text-primary font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-base': Platform.OS !== 'web',
              })}
            >
              Rewards
            </Text>
            <Text
              className={cn('text-text-primary -mt-1.5 font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-sm': Platform.OS !== 'web',
              })}
            >
              (Coming Soon)
            </Text>
          </View>
        </View>
      </Animated.View>
    </BaseButton>
  );
}

export function RewardsReferralPanel(props: {
  width: number;
  isGlowing?: boolean;
  onPress: VoidFunction;
}) {
  const { width, isGlowing, onPress } = props;
  const originalWidth = 168;
  const originalHeight = 80;
  const scaleX = width / originalWidth;

  const { hoverSound1, pressSound } = useAudioContext().sounds;

  const scale = useSharedValue(1);
  const imageTranslationY = useSharedValue(0);

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      width,
      height: originalHeight,
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: 102,
      height: 108,
      overflow: 'hidden',
      position: 'absolute',
      right: -3,
      bottom: -30,
      transform: [{ translateY: imageTranslationY.value }],
    };
  });

  useEffect(() => {
    let isMounted = true;

    const startAnimationLoop = async () => {
      while (isMounted) {
        await bounceImage(imageTranslationY);
      }
    };

    if (isGlowing) startAnimationLoop();

    return () => {
      isMounted = false;
    };
  }, [isGlowing]);

  return (
    <BaseButton
      onPress={onPress}
      pressSound={pressSound}
      onHoverIn={() => handleHoverIn(scale, hoverSound1!)}
      onHoverOut={() => handleHoverOut(scale)}
    >
      <Animated.View style={animatedViewStyle}>
        <Svg
          width={width}
          height={originalHeight}
          viewBox={`0 0 ${width} ${originalHeight}`}
          fill='none'
        >
          <Path
            d={`M${3.42996 * scaleX} 11.4008C${3.74929 * scaleX} 5.01425 ${
              9.0205 * scaleX
            } 0 ${15.415 * scaleX} 0H${156 * scaleX}C${162.627 * scaleX} 0 ${
              168 * scaleX
            } 5.37258 ${168 * scaleX} 12V68C${168 * scaleX} 74.6274 ${
              162.627 * scaleX
            } 80 ${156 * scaleX} 80H${12.615 * scaleX}C${5.75222 * scaleX} 80 ${
              0.287252 * scaleX
            } 74.255 ${0.629963 * scaleX} 67.4007L${3.42996 * scaleX} 11.4008Z`}
            fill='url(#paint0_linear_10652_7366)'
          />
          <Defs>
            <LinearGradient
              id='paint0_linear_10652_7366'
              x1={168 * scaleX}
              y1='77'
              x2={9 * scaleX}
              y2='0'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#B6BC19' />
              <Stop offset='1' stopColor='#046D6D' />
            </LinearGradient>
          </Defs>
        </Svg>

        {isGlowing && (
          <View className='border-background bg-primary absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2' />
        )}

        <View
          className='pointer-events-none absolute h-full w-full overflow-hidden rounded-2xl'
          pointerEvents='none'
        >
          <ImageSvg
            source={referralDecoration}
            style={{
              overflow: 'hidden',
              position: 'absolute',
            }}
            height={80}
            width={width}
          />

          <Animated.Image source={referralIcon} style={animatedImageStyle} />

          <DoubleChevronButton
            className='absolute bottom-1.5 left-3'
            backgroundColor={'#6FA750'}
            isGlowing={isGlowing}
          />
          <View
            className={cn('absolute left-3 flex flex-col', {
              'top-1.5': Platform.OS === 'web',
              'top-1': Platform.OS !== 'web',
            })}
          >
            <Text
              className={cn('text-text-primary font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-base': Platform.OS !== 'web',
              })}
            >
              Referral
            </Text>
            <Text
              className={cn('text-text-primary -mt-2.5 font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-base': Platform.OS !== 'web',
              })}
            >
              Program
            </Text>
          </View>
        </View>
      </Animated.View>
    </BaseButton>
  );
}

export function RewardsCheckinPanel(props: {
  width: number;
  isGlowing?: boolean;
  onPress: VoidFunction;
}) {
  const { width, isGlowing, onPress } = props;
  const originalWidth = 173;
  const originalHeight = 80;
  const scaleX = width / originalWidth;

  const { hoverSound1, pressSound } = useAudioContext().sounds;

  const scale = useSharedValue(1);
  const imageTranslationY = useSharedValue(0);

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      width,
      height: originalHeight,
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: 105,
      height: 105,
      overflow: 'hidden',
      position: 'absolute',
      right: -10,
      bottom: -20,
      transform: [{ translateY: imageTranslationY.value }],
    };
  });

  useEffect(() => {
    let isMounted = true;

    const startAnimationLoop = async () => {
      while (isMounted) {
        await bounceImage(imageTranslationY);
      }
    };

    if (isGlowing) startAnimationLoop();

    return () => {
      isMounted = false;
    };
  }, [isGlowing]);

  return (
    <BaseButton
      onPress={onPress}
      pressSound={pressSound}
      onHoverIn={() => handleHoverIn(scale, hoverSound1!)}
      onHoverOut={() => handleHoverOut(scale)}
    >
      <Animated.View style={animatedViewStyle}>
        <Svg
          width={width}
          height={originalHeight}
          viewBox={`0 0 ${width} ${originalHeight}`}
          fill='none'
        >
          <Path
            d={`M${3.42996 * scaleX} 11.4008C${3.74929 * scaleX} 5.01425 ${
              9.0205 * scaleX
            } 0 ${15.415 * scaleX} 0H${161 * scaleX}C${167.627 * scaleX} 0 ${
              173 * scaleX
            } 5.37258 ${173 * scaleX} 12V68C${173 * scaleX} 74.6274 ${
              167.627 * scaleX
            } 80 ${161 * scaleX} 80H${12.615 * scaleX}C${5.75222 * scaleX} 80 ${
              0.287252 * scaleX
            } 74.255 ${0.629963 * scaleX} 67.4007L${3.42996 * scaleX} 11.4008Z`}
            fill='url(#paint0_linear_10652_7475)'
          />
          <Defs>
            <LinearGradient
              id='paint0_linear_10652_7475'
              x1={173 * scaleX}
              y1='75.5001'
              x2={1 * scaleX}
              y2='3.5001'
              gradientUnits='userSpaceOnUse'
            >
              <Stop stopColor='#E19EEF' />
              <Stop offset='1' stopColor='#43148E' />
            </LinearGradient>
          </Defs>
        </Svg>

        {isGlowing && (
          <View className='border-background bg-primary absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2' />
        )}

        <View
          className='pointer-events-none absolute h-full w-full overflow-hidden rounded-2xl'
          pointerEvents='none'
        >
          <ImageSvg
            source={checkinDecoration}
            style={{
              overflow: 'hidden',
              position: 'absolute',
            }}
            height={80}
            width={width}
          />

          <Animated.Image source={checkinIcon} style={animatedImageStyle} />

          <DoubleChevronButton
            className='absolute bottom-1.5 left-3'
            backgroundColor={'#996C9C'}
            isGlowing={isGlowing}
          />
          <View
            className={cn('absolute left-3 flex flex-col', {
              'top-1.5': Platform.OS === 'web',
              'top-1': Platform.OS !== 'web',
            })}
          >
            <Text
              className={cn('text-text-primary font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-base': Platform.OS !== 'web',
              })}
            >
              Daily
            </Text>
            <Text
              className={cn('text-text-primary -mt-2.5 font-medium', {
                'text-lg': Platform.OS === 'web',
                'text-base': Platform.OS !== 'web',
              })}
            >
              Check-In
            </Text>
          </View>
        </View>
      </Animated.View>
    </BaseButton>
  );
}
