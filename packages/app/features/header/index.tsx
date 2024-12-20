import { Platform } from 'react-native';

export function usePlatformHeaderHeight() {
  return { headerHeight: Platform.OS === 'ios' ? 48 : 56 };
}
