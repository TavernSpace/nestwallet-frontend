import cn from 'classnames';
import { styled } from 'nativewind';
import { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LightBackground from '../../../assets/images/light-background.png';
import XP from '../../../assets/images/xp.svg';
import { colors } from '../../../design/constants';
import { Image } from '../../image';
import { Svg } from '../../svg';
import { Text } from '../../text';
import { View } from '../../view';
import { useParticleAnimation } from './utils';

const images = [
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond1.png',
    height: 13,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond2.png',
    height: 17,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond3.png',
    height: 19,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond4.png',
    height: 19,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond5.png',
    height: 27,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond6.png',
    height: 27,
  },
  {
    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/diamond7.png',
    height: 54,
  },
];

const check =
  'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/checkin/check.png';

interface DailyCheckInCardProps {
  className: string;
  index: number;
  currentIndex: number;
  points: number;
  claimable: boolean;
  style?: StyleProp<ViewStyle>;
}

export const DailyCheckInCard = styled(function (props: DailyCheckInCardProps) {
  const { index, currentIndex, points, claimable, style } = props;
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;
  const image = images[index]!;

  const translateY = useSharedValue(isCompleted ? 0 : 40);
  const opacity = useSharedValue(isCompleted ? 1 : 0);
  const rotation = useSharedValue(0);

  const checkMarkAnimation = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const rotatingBackgroundAnimation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    if (isCompleted) {
      translateY.value = withTiming(0, { duration: 400 });
      opacity.value = withTiming(1, { duration: 400 });
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [isCompleted, translateY, opacity, rotation]);

  const particles = useParticleAnimation({ isCurrent, claimable });

  const renderParticles = () =>
    particles.map((particle, idx) => {
      const size = Math.random() * 2 + 2;
      const style = useAnimatedStyle(() => ({
        opacity: particle.opacity.value,
        transform: [
          { translateX: particle.translateX.value },
          { translateY: particle.translateY.value },
        ],
        width: size,
        height: size,
        borderRadius: size,
      }));
      return <Animated.View key={idx} style={[styles.particle, style]} />;
    });

  return (
    <View
      className={cn('bg-card relative h-24 overflow-hidden rounded-lg', {
        'border-primary border': isCurrent && claimable,
      })}
      style={style}
    >
      {isCurrent && claimable && (
        <>
          <Animated.View
            style={[
              rotatingBackgroundAnimation,
              {
                width: 128,
                position: 'absolute',
                top: -24,
                right: -24,
                bottom: -24,
                left: -24,
              },
            ]}
          >
            <Image
              source={LightBackground}
              style={{
                width: '100%',
                height: '100%',
              }}
              contentFit='cover'
            />
          </Animated.View>
        </>
      )}
      {renderParticles()}
      <View
        className={cn('flex h-full flex-col justify-between p-2', {
          'opacity-30': isCompleted,
        })}
      >
        <Text className='text-text-secondary text-center text-sm font-medium'>
          {`Day ${index + 1}`}
        </Text>
        <Image
          source={{ uri: image.uri }}
          style={{ width: '100%', height: image.height }}
          contentFit='contain'
        />
        <View className='space-x-1/2 flex flex-row justify-center'>
          <Text className='text-text-primary text-sm font-bold'>{`+${points}`}</Text>
          <Svg source={XP} height={12} width={16} />
        </View>
      </View>
      {isCompleted && (
        <Animated.View
          style={[
            checkMarkAnimation,
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          ]}
        >
          <View className='h-full w-full flex-col items-center justify-center'>
            <Image source={{ uri: check }} style={{ width: 26, height: 23 }} />
          </View>
        </Animated.View>
      )}
    </View>
  );
});

interface ContinuousCheckInCard {
  index: number;
  currentIndex: number;
  points: number;
  claimable: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ContinuousCheckInCard = styled(function (
  props: ContinuousCheckInCard,
) {
  const { index, currentIndex, points, claimable, style } = props;

  const isCurrent = index === currentIndex;
  const image = images[6]!;

  return (
    <View
      className={cn('bg-card h-24 rounded-lg px-4 py-2', {
        'border-primary border': isCurrent && claimable,
      })}
      style={style}
    >
      <View className='flex h-full flex-col justify-between'>
        <Text className='text-text-secondary text-sm font-medium'>Day 7+</Text>
        <View className='flex flex-row items-end'>
          <View className='space-x-1/2 flex flex-row'>
            <Text className='text-text-primary text-base font-bold'>{`+${points}`}</Text>
            <Svg source={XP} height={12} width={16} />
          </View>
          <Image
            source={{ uri: image.uri }}
            style={{ width: '100%', height: image.height }}
            contentFit='contain'
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: colors.primary,
    top: '50%',
    left: '50%',
  },
});
