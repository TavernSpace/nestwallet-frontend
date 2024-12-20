import { styled } from 'nativewind';
import { useEffect } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../design/constants';
import { adjustTextStyle } from '../../design/utils';
import { BaseButton } from '../button/base-button';
import { Text } from '../text';
import { View } from '../view';

export const FilterTab = styled(function (props: {
  name: string;
  routes: {
    key: string;
    title: string;
  }[];
  index: number;
  count?: number;
  position: Animated.AnimatedInterpolation<number>;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { name, routes, index, count, position, onPress, style } = props;

  //Note: We can't use reanimated here. position is given as an AnimatedInterpolation<number>. This is not compatible with reanimated sharedvalues. Trying to create a shared value out of it will cause it to be inaccurate and laggy
  useEffect(() => {
    // https://github.com/react-navigation/react-navigation/issues/11564#issuecomment-2210403629
    position.addListener(() => {});
    return () => {
      position.removeAllListeners();
    };
  }, [position]);

  const inputRange = routes.map((_x, i) => i);

  const textColor = position.interpolate({
    inputRange,
    outputRange: inputRange.map((inputIndex) =>
      inputIndex === index ? colors.primary : colors.textSecondary,
    ),
  });

  const textOpacity = position.interpolate({
    inputRange,
    outputRange: inputRange.map((inputIndex) => (inputIndex === index ? 1 : 0)),
  });

  const barWidth = position.interpolate({
    inputRange,
    outputRange: inputRange.map((inputIndex) =>
      inputIndex === index ? '100%' : '0%',
    ),
  });

  const barOpacity = position.interpolate({
    inputRange,
    outputRange: inputRange.map((inputIndex) => (inputIndex === index ? 1 : 0)),
  });

  const textStyle = adjustTextStyle({
    color: colors.primary,
    position: 'absolute',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  });

  const textAnimatedStyle = {
    opacity: textOpacity,
  };

  return (
    <View style={style}>
      <BaseButton onPress={onPress}>
        <View className='flex flex-col items-center px-2'>
          <View className='flex flex-row items-center space-x-1'>
            <View>
              <Text className='text-text-secondary text-sm font-medium'>
                {name}
              </Text>
              <Animated.Text
                allowFontScaling={false}
                style={[textStyle, textAnimatedStyle]}
              >
                {name}
              </Animated.Text>
            </View>
            {count !== undefined && (
              <View className='bg-primary/10 rounded-[5px] px-1.5'>
                <Text className='text-primary text-xs font-medium'>{1}</Text>
              </View>
            )}
          </View>
          <View className='w-full items-center justify-center'>
            <Animated.View
              style={{
                height: 2,
                marginTop: 4,
                borderRadius: 12,
                width: Platform.OS === 'web' ? barWidth : '100%', // Width is not animatable on mobile unless you use reanimated
                backgroundColor: colors.primary,
                opacity: barOpacity,
              }}
            />
          </View>
        </View>
      </BaseButton>
    </View>
  );
});
