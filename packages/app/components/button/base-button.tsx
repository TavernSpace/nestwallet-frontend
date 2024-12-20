import { Audio } from 'expo-av';
import { styled } from 'nativewind';
import {
  GestureResponderEvent,
  MouseEvent,
  Platform,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { TouchableRipple, TouchableRippleProps } from 'react-native-paper';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

export type BaseButtonProps = TouchableRippleProps & {
  animationEnabled?: boolean;
  rippleEnabled?: boolean;
  pressableStyle?: StyleProp<ViewStyle>;
  scale?: number;
  hoverSound?: Audio.Sound;
  pressSound?: Audio.Sound;
  tabIndex?: number;
};

export const BaseButton = styled(function (props: BaseButtonProps) {
  const {
    style,
    animationEnabled = true,
    rippleEnabled = true,
    pressableStyle,
    hoverSound,
    pressSound,
    onPress,
    onHoverIn,
    scale: customScale,
    ...buttonProps
  } = props;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(customScale || 0.97, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = async (e: GestureResponderEvent) => {
    if (Platform.OS !== 'android') pressSound?.replayAsync(); //Android has a press sound already
    onPress?.(e);
  };

  const handleHoverIn = (e: MouseEvent) => {
    hoverSound?.replayAsync();
    onHoverIn?.(e);
  };

  const canInteract =
    (!!props.onPress || !!props.onLongPress || !!props.onPressIn) &&
    !props.disabled;
  const pointerStyle = canInteract ? [] : [{ pointerEvents: 'none' as const }];

  // TODO: android ripple effects not working as expected so for now just disable
  // Ripple seems to not respect border radius on android
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {rippleEnabled !== false && Platform.OS !== 'android' ? (
        <TouchableRipple
          {...buttonProps}
          onHoverIn={(e) => handleHoverIn(e)}
          onPressIn={animationEnabled ? handlePressIn : undefined}
          onPressOut={animationEnabled ? handlePressOut : undefined}
          onPress={handlePress}
          style={[pressableStyle, ...pointerStyle]}
        />
      ) : (
        <Pressable
          {...buttonProps}
          onHoverIn={(e) => handleHoverIn(e)}
          onPressIn={animationEnabled ? handlePressIn : undefined}
          onPressOut={animationEnabled ? handlePressOut : undefined}
          onPress={handlePress}
          style={pointerStyle}
        />
      )}
    </Animated.View>
  );
});
