import { Platform } from 'react-native';
import {
  EdgeInsets,
  useSafeAreaInsets as RNUseSafeAreaInsets,
} from 'react-native-safe-area-context';

export function useSafeAreaInsets(
  defaults = {
    bottom: 16,
  },
): EdgeInsets {
  if (Platform.OS !== 'web') {
    const insets = RNUseSafeAreaInsets();
    return {
      top: insets.top,
      bottom: Math.max(insets.bottom, defaults.bottom),
      left: insets.left,
      right: insets.right,
    };
  } else {
    return {
      top: 0,
      bottom: defaults.bottom,
      left: 0,
      right: 0,
    };
  }
}
