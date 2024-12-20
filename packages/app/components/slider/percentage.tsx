import { styled } from 'nativewind';
import { memo } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { IntRange } from '../../common/types';
import { opaque } from '../../common/utils/functions';
import { colors } from '../../design/constants';
import { Text } from '../text';
import { View } from '../view';
import { Slider } from './index';

interface PercentageSliderProps {
  percentage: number;
  sliderColor: string;
  opacity?: IntRange<0, 101>;
  onPercentageChange: (percentage: number) => void;
  onStart?: VoidFunction;
  onRelease?: (percentage: number) => void;
  style?: StyleProp<ViewStyle>;
}

function arePropsEqual(
  prev: PercentageSliderProps,
  cur: PercentageSliderProps,
) {
  return (
    prev.percentage === cur.percentage &&
    prev.sliderColor === cur.sliderColor &&
    prev.onRelease === cur.onRelease
  );
}

export const PercentageSlider = memo(
  styled(function (props: PercentageSliderProps) {
    const {
      percentage,
      sliderColor,
      opacity = 10,
      onPercentageChange,
      onStart,
      onRelease,
      style,
    } = props;

    return (
      <View style={style}>
        <View className='flex-1'>
          <PanGestureHandler>
            <Slider
              containerStyle={{
                overflow: 'hidden',
                borderRadius: 16,
                paddingLeft: 24,
                backgroundColor: opaque(
                  sliderColor,
                  colors.cardHighlight,
                  opacity,
                ),
              }}
              value={percentage}
              onSlidingStart={onStart}
              onValueChange={(value) => onPercentageChange(value[0]!)}
              onSlidingComplete={(value) => onRelease?.(value[0]!)}
              minimumValue={0}
              step={1}
              maximumValue={100}
              trackStyle={{
                backgroundColor: colors.cardHighlight,
                height: 36,
                overflow: 'hidden',
              }}
              minimumTrackTintColor={opaque(
                sliderColor,
                colors.cardHighlight,
                opacity,
              )}
              trackMarks={[0, 25, 50, 75, 100]}
              trackRightPadding={48}
              renderThumbComponent={() => (
                <View
                  className='h-9 w-12 items-center justify-center rounded-r-2xl'
                  style={{
                    marginLeft: Platform.OS === 'web' ? -23.5 : undefined,
                    backgroundColor: opaque(
                      sliderColor,
                      colors.cardHighlight,
                      opacity,
                    ),
                  }}
                >
                  <View
                    className='h-3 w-[1px]'
                    style={{ backgroundColor: sliderColor }}
                  />
                </View>
              )}
              renderTrackMarkComponent={() => (
                <View
                  className='z-10 h-[1px] w-[1px]'
                  style={{
                    marginLeft: Platform.OS !== 'web' ? 23.5 : undefined,
                    backgroundColor: sliderColor,
                  }}
                />
              )}
            />
          </PanGestureHandler>
        </View>
        <View className='h-9 w-16 items-center justify-center'>
          <Text className='text-text-primary text-sm font-medium'>
            {`${percentage}%`}
          </Text>
        </View>
      </View>
    );
  }),
  arePropsEqual,
);
