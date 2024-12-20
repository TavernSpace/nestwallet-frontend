import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Portal } from 'react-native-paper';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import { adjust } from '../../common/utils/style';
import { useSafeAreaInsets } from '../../features/safe-area';
import { IconButton } from '../button/icon-button';
import { View } from '../view';

interface SnackbarProps {
  isShowing: boolean;
  duration: number;
  closeIconColor: string;
  ignoreInset?: boolean;
  children?: React.ReactNode;
  snackbarStyle?: StyleProp<ViewStyle>;
  onClose: VoidFunction;
}

export function Snackbar(props: SnackbarProps) {
  const {
    isShowing,
    duration,
    closeIconColor,
    ignoreInset,
    children,
    snackbarStyle,
    onClose,
  } = props;
  const { top } = useSafeAreaInsets();

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [height, setHeight] = useState(0);

  const hideTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const outOfBounds = -(height + top + 10);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(outOfBounds);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      display: 'flex',
      width: '100%',
      paddingHorizontal: 8,
      paddingVertical: 8,
      top: ignoreInset ? 0 : top,
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleAnimateIn = async () => {
    clearHideTimeout();
    translateY.value = outOfBounds;
    opacity.value = 0;
    setShowSnackbar(true);
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(1, {
      duration: 200,
    });
    startHideTimeout();
  };

  const handleAnimateOut = async () => {
    clearHideTimeout();
    translateY.value = withTiming(outOfBounds, {
      duration: 300,
      easing: Easing.inOut(Easing.exp),
    });
    opacity.value = withTiming(0, {
      duration: 300,
    });
    await closeSnackbar();
  };

  const closeSnackbar = async () => {
    await delay(300);
    setShowSnackbar(false);
    onClose();
  };

  const startHideTimeout = () => {
    hideTimeout.current = setTimeout(handleAnimateOut, duration);
  };

  const clearHideTimeout = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
  };

  useEffect(() => {
    if (isShowing) {
      handleAnimateIn();
    }
    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, [isShowing]);

  const pan = Gesture.Pan()
    .onChange((event) => {
      runOnJS(clearHideTimeout)();
      translateY.value = Math.min(
        Math.max(outOfBounds, translateY.value + event.changeY),
        0,
      );
    })
    .onFinalize(() => {
      const swipeUp = translateY.value < 0;
      if (swipeUp) {
        translateY.value = withTiming(outOfBounds, {
          duration: 300,
          easing: Easing.inOut(Easing.exp),
        });
        opacity.value = withTiming(0, {
          duration: 300,
        });
        runOnJS(closeSnackbar)();
      } else {
        runOnJS(startHideTimeout)();
      }
    });

  if (!showSnackbar) {
    return null;
  }

  return (
    <Portal>
      <Animated.View
        style={animatedStyle}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      >
        <GestureDetector gesture={pan}>
          <View
            className='flex w-full flex-row items-center justify-between rounded-2xl px-4'
            style={snackbarStyle}
          >
            {children}
            <IconButton
              icon={faTimes}
              color={closeIconColor}
              size={adjust(20, 2)}
              onPress={handleAnimateOut}
            />
          </View>
        </GestureDetector>
      </Animated.View>
    </Portal>
  );
}
