import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, Platform, UIManager } from 'react-native';

export const useExperimentalAnimation = () => {
  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
};

export const useEffectAfterTransition = (effect: VoidFunction) => {
  if (Platform.OS === 'web') {
    const navigation = useNavigation();
    useEffect(() => {
      const unsubscribe = navigation.addListener(
        'transitionEnd' as any,
        effect,
      );
      return unsubscribe;
    }, []);
  } else {
    useFocusEffect(
      useCallback(() => {
        const task = InteractionManager.runAfterInteractions(effect);
        return () => task.cancel();
      }, []),
    );
  }
};

export const useTransitionFinished = () => {
  const [isDone, setIsDone] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() =>
        setIsDone(true),
      );
      return () => task.cancel();
    }, []),
  );
  return isDone;
};
