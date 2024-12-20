import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { empty } from '../../common/utils/functions';

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

export async function notificationAsync(
  type: Haptics.NotificationFeedbackType,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await Haptics.notificationAsync(type);
}

export async function impactAsync(
  style: Haptics.ImpactFeedbackStyle,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await Haptics.impactAsync(style);
}

export async function selectionAsync(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Haptics.selectionAsync();
}

export async function refreshHapticAsync() {
  await notificationAsync(NotificationFeedbackType.Success).catch(empty);
}
