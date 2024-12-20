import { useFocusEffect } from '@react-navigation/native';
import { styled } from 'nativewind';
import { useEffect, useRef } from 'react';
import { Animated, StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  default as ReAnimated,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useOnForegroundFocus } from '../../common/hooks/navigation';
import { colors } from '../../design/constants';
import { View } from '../view';

export const Skeleton = styled(function (props: {
  height: number | `${number}%`;
  width: number | `${number}%`;
  borderRadius?: number;
  color?: string;
  fixed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    height,
    width,
    borderRadius = 4,
    color = colors.cardHighlight,
    fixed,
    style,
  } = props;
  const opacity = useRef(new Animated.Value(0.3));
  const animationRef = useRef<Animated.CompositeAnimation>();

  useEffect(() => {
    if (!fixed) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity.current, {
            toValue: 1,
            useNativeDriver: true,
            duration: 500,
          }),
          Animated.timing(opacity.current, {
            toValue: 0.3,
            useNativeDriver: true,
            duration: 800,
          }),
        ]),
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      opacity.current.setValue(0.3);
    }
  }, [opacity, fixed]);

  return (
    <Animated.View
      style={[
        {
          opacity: opacity.current,
          height,
          width,
          backgroundColor: color,
          borderRadius,
        },
        style,
      ]}
    />
  );
});

export const TextSkeleton = styled(function (props: {
  text: string;
  fadeDuration?: number;
  characterAnimationDelay?: number;
  delayBetweenIterationsAmount?: number;
  style?: StyleProp<TextStyle>;
}) {
  const {
    text,
    characterAnimationDelay = 150,
    fadeDuration,
    delayBetweenIterationsAmount,
    style,
  } = props;

  const textArray = text.split('');

  return (
    <View className='flex flex-row items-center -space-x-2'>
      {textArray.map((char, index) => (
        <FlashingText
          text={char}
          delayBeforeAnimateAmount={index * characterAnimationDelay}
          fadeDuration={fadeDuration}
          delayBetweenIterationsAmount={delayBetweenIterationsAmount}
          style={style}
          key={index}
        />
      ))}
    </View>
  );
});

const FlashingText = styled(function (props: {
  text: string;
  delayBeforeAnimateAmount?: number;
  delayBetweenIterationsAmount?: number;
  fadeDuration?: number;
  style?: StyleProp<TextStyle>;
}) {
  const {
    text,
    style,
    delayBeforeAnimateAmount,
    delayBetweenIterationsAmount,
    fadeDuration,
  } = props;
  const opacity = useSharedValue(1);

  const handleStartFlashing = async () => {
    //Reset animation
    cancelAnimation(opacity);
    opacity.value = 1;

    opacity.value = withDelay(
      delayBeforeAnimateAmount ?? 0,
      withRepeat(
        withDelay(
          delayBetweenIterationsAmount ?? 0,
          withSequence(
            withTiming(0.2, { duration: fadeDuration ?? 600 }),
            withTiming(1, { duration: fadeDuration ?? 600 }),
          ),
        ),
        -1,
      ),
    );
  };

  //Maybe combine these into one hook
  //This is done to prevent the aniamtion from going out of sync when: Switching windows and switching tabs/screens in app
  useFocusEffect(() => {
    handleStartFlashing();
  });
  useOnForegroundFocus(handleStartFlashing, true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <ReAnimated.Text style={[style, animatedStyle]}>{text}</ReAnimated.Text>
  );
});
