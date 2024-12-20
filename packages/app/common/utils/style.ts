import { Platform } from 'react-native';

export function adjust(size: number, amount?: number) {
  return Platform.OS === 'web' ? size : size + (amount ?? 4);
}

export function withSize(size: number) {
  return {
    height: size,
    width: size,
  };
}
