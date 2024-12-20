import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { View } from '../view';

export const Divider = styled(function (props: {
  padding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { padding = 16, style } = props;

  return (
    <View className='w-full' style={[{ paddingHorizontal: padding }, style]}>
      <View className='bg-card-highlight h-[1px] w-full' />
    </View>
  );
});
