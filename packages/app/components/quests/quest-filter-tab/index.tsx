import cn from 'classnames';
import { styled } from 'nativewind';
import { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { SCREEN_WIDTH } from '../../../design/constants';
import { BaseButton } from '../../button/base-button';
import { Svg } from '../../svg';
import { Text } from '../../text';
import { View } from '../../view';

export const QuestFilterTab = styled(function (props: {
  name: string;
  source:
    | ImageSourcePropType
    | React.ComponentType<{ height: number; width: number }>;
  width: number;
  height: number;
  adornment?: React.ReactNode;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { name, source, width, height, adornment, onPress, style } = props;

  return (
    <View
      className='bg-card border-card-highlight flex-1 rounded-xl border'
      style={style}
    >
      <BaseButton onPress={onPress}>
        <View className=' w-full flex-col items-center justify-center'>
          <View className='flex flex-col items-center space-y-1 py-2'>
            <View
              className='flex flex-col items-center justify-end'
              style={{ width, height }}
            >
              <Svg
                source={source as ImageSourcePropType}
                width={width}
                height={height}
              />
            </View>
            <Text
              className={cn('text-text-primary font-medium', {
                'text-xs': SCREEN_WIDTH >= 350,
                'text-xss': SCREEN_WIDTH < 350,
              })}
            >
              {name}
            </Text>
            {adornment}
          </View>
        </View>
      </BaseButton>
    </View>
  );
});
