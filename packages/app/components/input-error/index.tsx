import cn from 'classnames';
import { styled } from 'nativewind';
import { memo, useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import { adjust } from '../../common/utils/style';
import { Text } from '../text';
import { View } from '../view';

export interface IErrorTooltipProps {
  isEnabled?: boolean;
  errorText?: string;
  truncate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const InlineErrorTooltip = memo(
  styled(function (props: IErrorTooltipProps) {
    const { errorText, isEnabled, truncate, style } = props;

    const [shouldRender, setShouldRender] = useState(false);

    const duration = 200;
    const scaleY = useSharedValue(0);
    const height = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => {
      return {
        height: `${height.value}%`,
        transform: [{ scaleY: scaleY.value }],
      };
    });

    const handleAnimate = async () => {
      if (isEnabled) {
        setShouldRender(true);
        await delay(duration);
        scaleY.value = withTiming(1, {
          duration: duration,
          easing: Easing.out(Easing.exp),
        });
        height.value = withTiming(100, {
          duration: duration,
          easing: Easing.out(Easing.exp),
        });
      } else {
        scaleY.value = withTiming(0, {
          duration: duration,
          easing: Easing.out(Easing.exp),
        });
        height.value = withTiming(0, {
          duration: duration,
          easing: Easing.out(Easing.exp),
        });
        await delay(duration);
        setShouldRender(false);
      }
    };

    useEffect(() => {
      handleAnimate();
    }, [isEnabled]);

    return shouldRender ? (
      <Animated.View style={[animatedStyle, style, { width: '100%' }]}>
        <View
          className='bg-failure/10 w-full justify-center rounded-lg px-4 py-2.5'
          style={{ minHeight: adjust(36) }}
        >
          <Text
            className={cn('text-failure text-xs font-medium', {
              truncate: truncate,
            })}
            numberOfLines={truncate ? 1 : undefined}
          >
            {errorText}
          </Text>
        </View>
      </Animated.View>
    ) : null;
  }),
);
