import cn from 'classnames';
import { BlurView } from 'expo-blur';
import { clamp } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import { opacity } from '../../common/utils/functions';
import { colors } from '../../design/constants';

export function Menu(props: {
  children: React.ReactNode;
  visible: boolean;
  anchor: React.ReactNode;
  anchorStyle?: StyleProp<ViewStyle>;
  width: number;
  height: number;
  animationDirection?: 'left' | 'right' | 'top' | 'bottom';
  offsets?: {
    x?: number;
    y?: number;
  };
  positionRightOverride?: number;
  onDismiss: VoidFunction;
}) {
  const {
    children,
    visible,
    anchor,
    anchorStyle,
    animationDirection = 'top',
    width,
    height,
    positionRightOverride,
    offsets,
    onDismiss,
  } = props;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [limit, setLimit] = useState({ x: 0, y: 0 });
  const [outerReady, setOuterReady] = useState(false);
  const [innerReady, setInnerReady] = useState(false);

  const viewRef = useRef<View>(null);
  const innerViewRef = useRef<View>(null);

  const { x: additionalXOffset = 0, y: additionalYOffset = 0 } = offsets ?? {};

  const initialtranslate =
    (animationDirection === 'top' || animationDirection === 'left' ? -1 : 1) *
    70;

  const scale = useSharedValue(0);
  const opacityValue = useSharedValue(0);
  const translate = useSharedValue(initialtranslate);

  const leftValue = clamp(
    position.x - offset.x - width + additionalXOffset,
    0,
    limit.x - width,
  );

  const topValue = clamp(
    position.y - offset.y + additionalYOffset,
    0,
    limit.y - height,
  );

  const handleOuterLayout = () => {
    if (!viewRef.current) return;
    if (visible) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        setPosition({ x: pageX, y: pageY });
        setOuterReady(true);
      });
    } else {
      setOuterReady(false);
    }
  };

  const handleInnerLayout = () => {
    if (!innerViewRef.current) return;
    innerViewRef.current.measure((x, y, width, height, pageX, pageY) => {
      setOffset({ x: pageX, y: pageY });
      setLimit({
        x: width,
        y: height,
      });
      setInnerReady(true);
    });
  };

  useEffect(() => {
    handleOuterLayout();

    //Allows users to close the menu when pressing 'back' on Android
    const backSubscription =
      Platform.OS === 'web'
        ? undefined
        : BackHandler.addEventListener('hardwareBackPress', () => {
            handleDismiss();
            return true;
          });

    if (!visible) {
      backSubscription && backSubscription.remove();
      //Reset animated values when closed
      scale.value = 0;
      translate.value = initialtranslate;
      opacityValue.value = 0;
    }

    return () => backSubscription && backSubscription.remove();
  }, [visible]);

  useEffect(() => {
    if (outerReady && innerReady) {
      translate.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      });
      opacityValue.value = withTiming(1, {
        duration: 200,
      });
    }
  }, [outerReady, innerReady]);

  const handleDismiss = async () => {
    translate.value = withTiming(initialtranslate, {
      duration: 200,
      easing: Easing.inOut(Easing.exp),
    });
    opacityValue.value = withTiming(0, { duration: 100 });
    await delay(200);
    onDismiss();
  };

  const positionStyle = {
    left: positionRightOverride ? undefined : leftValue,
    right: positionRightOverride ? positionRightOverride : undefined,
    top: topValue,
  };

  const menuStyle = useMemo(
    () => ({
      paddingVertical: 0.5,
      borderWidth: 1,
      borderRadius: 16,
      borderColor: colors.cardHighlightSecondary,
      width,
    }),
    [],
  );

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      zIndex: 10,
      width,
      borderRadius: 16,
      borderWidth: Platform.OS !== 'ios' ? 1 : 0,
      borderColor:
        Platform.OS !== 'ios' ? colors.cardHighlightSecondary : undefined,
      opacity: opacityValue.value,
      transform: [
        {
          translateX:
            animationDirection === 'left' || animationDirection === 'right'
              ? translate.value
              : 0,
        },
        {
          translateY:
            animationDirection === 'top' || animationDirection === 'bottom'
              ? translate.value
              : 0,
        },
      ],

      //Web and android needs these styles included in the animated style
      left: Platform.OS !== 'ios' ? positionStyle.left : undefined,
      right: Platform.OS !== 'ios' ? positionStyle.right : undefined,
      top: Platform.OS !== 'ios' ? positionStyle.top : undefined,
    };
  });

  return (
    <>
      <View ref={viewRef} style={anchorStyle} collapsable={false}>
        {anchor}
      </View>
      <Portal>
        {visible && (
          <View
            className='h-full w-full'
            onLayout={handleInnerLayout}
            collapsable={false}
            ref={innerViewRef}
          >
            <Pressable
              style={{ width: '100%', height: '100%' }}
              onPress={handleDismiss}
            >
              <View className='h-full w-full' />
            </Pressable>
            {outerReady &&
              innerReady &&
              (Platform.OS !== 'ios' ? (
                <Animated.View
                  className={cn({
                    'bg-card-highlight/80 backdrop-blur-sm':
                      Platform.OS === 'web',
                    'bg-card-highlight/90': Platform.OS !== 'web',
                  })}
                  style={animatedViewStyle}
                >
                  {children}
                </Animated.View>
              ) : (
                <Animated.View style={[animatedViewStyle, positionStyle]}>
                  <AnimatedBlur
                    intensity={12}
                    style={[
                      {
                        backgroundColor: opacity(colors.cardHighlight, 60),
                        overflow: 'hidden',
                      },
                      menuStyle,
                    ]}
                  >
                    {children}
                  </AnimatedBlur>
                </Animated.View>
              ))}
          </View>
        )}
      </Portal>
    </>
  );
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);
