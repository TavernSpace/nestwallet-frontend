import cn from 'classnames';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { useAudioContext } from '../../provider/audio';
import { View } from '../view';
import { useKeyboard } from './keyboard';

export interface ActionSheetContentProps {
  isShowing: boolean;
  isDetached?: boolean;
  detachedY?: number;
  detachedX?: number;
  centerDetached?: boolean;
  isFullHeight?: boolean;
  soundEnabled?: boolean;
  gestureEnabled?: boolean;
  hasTopInset?: boolean;
  hasBottomInset?: boolean;
  onBeforeShow?: VoidFunction;
  blur?: number;
  onClose: VoidFunction;
  onAfterOpen?: VoidFunction;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  portalHeight: number;
}

export const BACKDROP_COLOR = 'rgba(0, 0, 0, 0.6)';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// use child height or set height
export function ActionSheetContent(props: ActionSheetContentProps) {
  const {
    isShowing,
    isDetached = false,
    detachedX = 16,
    detachedY = 16,
    gestureEnabled = true,
    soundEnabled = true,
    hasTopInset = false,
    hasBottomInset = true,
    blur,
    containerStyle,
    children,
    portalHeight,
    onAfterOpen,
    isFullHeight: sheetFullHeight,
    onBeforeShow,
    onClose,
  } = props;
  const { openSheetSound, closeSheetSound } = useAudioContext().sounds;
  const { top, bottom } = useSafeAreaInsets();
  const { height: keyboardHeight } = useKeyboard();

  const [isVisible, setIsVisible] = useState(isShowing);

  const isFullHeight = useSharedValue(!!sheetFullHeight);
  const contentHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sheetOffset = useSharedValue(portalHeight);
  const childrenTranslationY = useSharedValue(400);

  const detachedAmount = isDetached ? Math.max(bottom, detachedY) : 0;
  const shouldRenderGestureDetector =
    gestureEnabled && !(Platform.OS === 'android' && sheetFullHeight);

  useEffect(() => {
    if (isFullHeight.value !== !!sheetFullHeight) {
      isFullHeight.value = !!sheetFullHeight;
    }
  }, [sheetFullHeight]);

  useEffect(() => {
    //Allows users to exit sheets when pressing 'back' on Android
    const backSubscription =
      //Using a backhandler throws warnings on web
      Platform.OS === 'web'
        ? undefined
        : BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
          });

    if (isShowing) {
      setIsVisible(true);
      if (soundEnabled) {
        openSheetSound?.replayAsync();
      }
    } else {
      backSubscription && backSubscription.remove();
      if (isVisible && soundEnabled) {
        closeSheetSound?.replayAsync();
      }
      onBeforeShow?.();
      // request animation frame to prevent stuttering
      requestAnimationFrame(() => {
        backdropOpacity.value = withTiming(0);
        contentOpacity.value = withTiming(0, { duration: 200 });
        childrenTranslationY.value = withTiming(400, { duration: 100 });
        sheetOffset.value = withTiming(
          portalHeight,
          { duration: 200, easing: Easing.out(Easing.exp) },
          () => runOnJS(handleClose)(),
        );
      });
    }
    if (onAfterOpen && isShowing) {
      setTimeout(onAfterOpen, 400);
    }
    return () => backSubscription && backSubscription.remove();
  }, [isShowing]);

  const handleClose = () => {
    isFullHeight.value = !!sheetFullHeight;
    setIsVisible(false);
  };

  const handleContentLayout = (event: LayoutChangeEvent) => {
    // consider sheet full height if we hit full height
    if (event.nativeEvent.layout.height >= portalHeight) {
      isFullHeight.value = true;
    }
    const layoutHeight = Math.min(
      portalHeight,
      event.nativeEvent.layout.height,
    );
    // sometimes layoutHeight is 0 on mobile during rerender, just ignore it
    contentHeight.value = withTiming(layoutHeight);
    sheetOffset.value = withTiming(portalHeight - layoutHeight, {
      duration: 200,
      easing: Easing.out(Easing.exp),
    });
    childrenTranslationY.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
    contentOpacity.value = withTiming(1, { duration: 200 });
    backdropOpacity.value = withTiming(1);
  };

  const pan = Gesture.Pan()
    .onChange((event) => {
      if (!gestureEnabled) return;
      const openOffset = portalHeight - contentHeight.value;
      const offsetDelta = event.changeY + sheetOffset.value;
      // clamp between portalHeight and openOffset
      sheetOffset.value = Math.max(openOffset, offsetDelta);
    })
    .onFinalize(() => {
      const openOffset = portalHeight - contentHeight.value;
      const currentOffset = portalHeight - sheetOffset.value;
      if (currentOffset < contentHeight.value * 0.9) {
        sheetOffset.value = withSpring(portalHeight, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        // otherwise restore to open state
        sheetOffset.value = withTiming(openOffset, { duration: 200 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const backgroundStyle = useAnimatedStyle(() => ({
    height: contentHeight.value,
    transform: [
      {
        translateY: isFullHeight.value
          ? sheetOffset.value
          : sheetOffset.value - keyboardHeight.value,
      },
    ],
    opacity: contentOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    // if isFullHeight don't shift sheet up, just display keyboard
    transform: [
      {
        translateY: isFullHeight.value
          ? sheetOffset.value
          : sheetOffset.value -
            keyboardHeight.value -
            (keyboardHeight.value > 0
              ? Math.min(16, detachedAmount)
              : detachedAmount),
      },
    ],
    opacity: contentOpacity.value,
  }));

  const childrenStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: childrenTranslationY.value }],
    opacity: contentOpacity.value,
    width: '100%',
    height: '100%',
  }));

  if (!isVisible) {
    return null;
  }

  const defaultTopPadding = isFullHeight
    ? Platform.OS === 'ios'
      ? 12
      : 16
    : 16;
  const bottomInset = hasBottomInset
    ? isDetached
      ? 16
      : Math.max(bottom, 16)
    : 0;

  const innerView = (
    <Animated.View style={[sheetStyle, containerStyle, styles.inner]}>
      <View className='flex w-full flex-row'>
        {isDetached && <View style={{ width: detachedX }} />}
        <View
          className={cn('bg-background flex-1 overflow-hidden', {
            'rounded-3xl': isDetached,
            'rounded-t-3xl ': !isDetached,
          })}
          style={{
            height: isFullHeight.value ? portalHeight : undefined,
          }}
          onLayout={handleContentLayout}
        >
          {isDetached ? (
            <Animated.View
              style={[
                {
                  paddingTop: 16,
                  paddingBottom: bottomInset,
                  maxHeight: portalHeight - bottomInset - 16,
                },
                childrenStyle,
              ]}
            >
              {children}
            </Animated.View>
          ) : (
            <Animated.View style={[childrenStyle]}>
              <View
                className='h-full w-full'
                style={{
                  paddingBottom: bottomInset,
                  paddingTop: hasTopInset
                    ? Math.max(top, defaultTopPadding)
                    : defaultTopPadding,
                }}
              >
                {children}
              </View>
            </Animated.View>
          )}
        </View>
        {isDetached && <View style={{ width: detachedX }} />}
      </View>
    </Animated.View>
  );

  return (
    <View
      className='flex-1'
      style={
        {
          backdropFilter: blur ? `blur(${blur}px)` : undefined,
        } as any
      }
    >
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={onClose}
        disabled={!gestureEnabled}
      />
      {/* so that when we resize from taller to shorter screen, we don't see a gap at the bottom */}
      {!isDetached && (
        <Animated.View style={[styles.background, backgroundStyle]} />
      )}
      {shouldRenderGestureDetector ? (
        <GestureDetector gesture={pan}>{innerView}</GestureDetector>
      ) : (
        innerView
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    backgroundColor: colors.background,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP_COLOR,
    zIndex: 1,
  },
  inner: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
  },
});
