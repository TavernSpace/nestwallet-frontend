import { BlurView } from 'expo-blur';
import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { View } from '../view';

// TODO: blur is not working on mobile https://github.com/expo/expo/issues/6613
export const Blur = styled(function (props: {
  intensity: number;
  disableBlur?: boolean;
  androidEnabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    intensity,
    disableBlur,
    androidEnabled = false,
    children,
    style,
  } = props;
  return disableBlur ? (
    <View style={style}>{children}</View>
  ) : Platform.OS === 'web' ? (
    <View className='backdrop-blur-sm' style={style}>
      {children}
    </View>
  ) : (
    <BlurView
      intensity={intensity}
      tint='dark'
      experimentalBlurMethod={androidEnabled ? 'dimezisBlurView' : undefined}
      style={style}
    >
      {children}
    </BlurView>
  );
});
