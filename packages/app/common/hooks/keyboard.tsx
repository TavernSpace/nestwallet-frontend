import { useEffect } from 'react';
import { Keyboard, LayoutAnimation, Platform } from 'react-native';

export const useKeyboardHide = (
  setKeyboardVisible: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardWillShowListener = Keyboard.addListener(
      keyboardShowEvent,
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      keyboardHideEvent,
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);
};
