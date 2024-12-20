import { useEffect } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  KeyboardEventName,
  Platform,
} from 'react-native';
import {
  runOnUI,
  useSharedValue,
  useWorkletCallback,
  withTiming,
} from 'react-native-reanimated';

const KEYBOARD_EVENT_MAPPER = {
  KEYBOARD_SHOW: Platform.select({
    ios: 'keyboardWillShow',
    android: 'keyboardDidShow',
    default: '',
  }) as KeyboardEventName,
  KEYBOARD_HIDE: Platform.select({
    ios: 'keyboardWillHide',
    android: 'keyboardDidHide',
    default: '',
  }) as KeyboardEventName,
};

export function useKeyboard() {
  const keyboardHeight = useSharedValue(0);

  const handleKeyboardEvent = useWorkletCallback(
    (height: number, duration: number, easing) => {
      keyboardHeight.value = withTiming(height, { duration });
    },
    [],
  );

  useEffect(() => {
    const handleOnKeyboardShow = (event: KeyboardEvent) => {
      runOnUI(handleKeyboardEvent)(
        event.endCoordinates.height,
        event.duration,
        event.easing,
      );
    };
    const handleOnKeyboardHide = (event: KeyboardEvent) => {
      runOnUI(handleKeyboardEvent)(0, event.duration, event.easing);
    };

    const showSubscription = Keyboard.addListener(
      KEYBOARD_EVENT_MAPPER.KEYBOARD_SHOW,
      handleOnKeyboardShow,
    );

    const hideSubscription = Keyboard.addListener(
      KEYBOARD_EVENT_MAPPER.KEYBOARD_HIDE,
      handleOnKeyboardHide,
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [handleKeyboardEvent]);

  return {
    height: keyboardHeight,
  };
}
