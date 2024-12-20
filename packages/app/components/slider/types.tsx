import * as React from 'react';
import { Animated, ImageSourcePropType, ViewStyle } from 'react-native';

export type Dimensions = {
  height: number;
  width: number;
};

/**
 * Callback for slider change events. The second number value will be only if provided an array with two values in `value` prop
 */
export type SliderOnChangeCallback = (
  value: Array<number>,
  index: number,
) => void;

export type SliderProps = {
  animateTransitions?: boolean;
  animationConfig?: {
    spring?: Animated.AnimatedProps<ViewStyle>;
    timing?: Animated.AnimatedProps<ViewStyle>;
  };
  animationType: 'spring' | 'timing';
  containerStyle?: ViewStyle;
  disabled?: boolean;
  maximumTrackTintColor?: string;
  maximumTrackStyle?: ViewStyle;
  maximumValue: number;
  minimumTrackTintColor?: string;
  minimumTrackStyle?: ViewStyle;
  minimumValue: number;
  onSlidingComplete?: SliderOnChangeCallback;
  onSlidingStart?: SliderOnChangeCallback;
  onValueChange?: SliderOnChangeCallback;
  renderThumbComponent?: (
    index: number,
  ) => React.ReactNode | Array<() => React.ReactNode>;
  renderMaximumTrackComponent?: () => React.ReactNode;
  renderMinimumTrackComponent?: () => React.ReactNode;
  renderTrackMarkComponent?: (index: number) => React.ReactNode;
  step?: number;
  thumbImage?: ImageSourcePropType;
  thumbStyle?: ViewStyle;
  thumbTintColor?: string;
  thumbTouchSize?: Dimensions;
  trackClickable?: boolean;
  trackMarks?: Array<number>;
  trackRightPadding?: number;
  trackLeftPadding?: number;
  trackStyle?: ViewStyle;
  value?: number;
  vertical?: boolean;
};

export type SliderState = {
  allMeasured: boolean;
  containerSize: Dimensions;
  thumbSize: Dimensions;
  trackMarksValues?: Array<Animated.Value>;
  values: Array<Animated.Value>;
};
