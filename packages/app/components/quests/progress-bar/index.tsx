import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../design/constants';
import { View } from '../../view';

export type ProgressBarProps = {
  progress: number;
  width: number;
  height: number;
  color: string;
  unfilledColor: string;
  borderRadius: number;
  borderWidth: number;
  style?: StyleProp<ViewStyle>;
};

export const ProgressBar = styled(function (props: ProgressBarProps) {
  const {
    progress,
    width,
    height,
    color,
    unfilledColor,
    borderRadius,
    borderWidth,
  } = props;

  const filledWidth = progress * width;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          borderRadius,
          borderColor: unfilledColor,
          borderWidth,
          backgroundColor: unfilledColor,
          height,
        },
      ]}
    >
      <View
        style={[
          styles.filledSection,
          {
            width: filledWidth,
            backgroundColor: color,
            borderRadius: filledWidth ? borderRadius : 0,
          },
        ]}
      />
    </View>
  );
});

export const SteppedProgressBar = styled(function (
  props: Omit<ProgressBarProps, 'progress'> & {
    currentStep: number;
    steps: number;
  },
) {
  const {
    currentStep,
    steps,
    width,
    height,
    color,
    unfilledColor,
    borderRadius,
    borderWidth,
  } = props;

  return (
    <View className='flex flex-row space-x-0.5'>
      {Array.from(Array(steps).keys()).map((_, index) => (
        <View
          key={index}
          style={{
            width: width / steps - 2,
            height,
            backgroundColor: currentStep > index ? color : unfilledColor,
            borderTopLeftRadius: index === 0 ? borderRadius : 0,
            borderBottomLeftRadius: index === 0 ? borderRadius : 0,
            borderTopRightRadius: index === steps - 1 ? borderRadius : 0,
            borderBottomRightRadius: index === steps - 1 ? borderRadius : 0,
            borderWidth,
          }}
        />
      ))}
    </View>
  );
});

export const AnimatedProgressBar = (props: ProgressBarProps) => {
  const {
    progress,
    width,
    height,
    color,
    unfilledColor,
    borderRadius,
    borderWidth,
    style,
  } = props;

  const animatedProgress = useSharedValue(0);
  const targetWidth = useSharedValue(0);

  const [isFirstRun, setIsFirstRun] = useState(true);
  const [showTargetIndicator, setShowTargetIndicator] = useState(false);

  const animateProgress = () => {
    animatedProgress.value = withTiming(
      progress * width,
      { duration: 1500, easing: Easing.out(Easing.exp) },
      (finished) => {
        if (finished) {
          runOnJS(setIsFirstRun)(false);
          runOnJS(setShowTargetIndicator)(true);
        }
      },
    );
  };

  useEffect(() => {
    if (isFirstRun) {
      animateProgress();
      return;
    }

    setShowTargetIndicator(true);
    targetWidth.value = withTiming(
      progress * width,
      { duration: 500, easing: Easing.out(Easing.exp) },
      () => runOnJS(animateProgress)(),
    );
  }, [progress, width, isFirstRun]);

  const filledStyle = useAnimatedStyle(() => ({
    width: animatedProgress.value,
    backgroundColor: color,
    borderRadius: borderRadius,
    height,
  }));

  const targetStyle = useAnimatedStyle(() => ({
    width: targetWidth.value,
    backgroundColor: colors.textSecondary,
    borderRadius: borderRadius,
    height,
    position: 'absolute',
    top: 0,
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          borderWidth,
          borderColor: unfilledColor,
          backgroundColor: unfilledColor,
        },
        style,
      ]}
    >
      {showTargetIndicator && <Animated.View style={targetStyle} />}
      <Animated.View style={filledStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  filledSection: {
    height: '100%',
  },
});
