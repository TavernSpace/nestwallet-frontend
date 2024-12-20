import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../text';
import { View } from '../view';
import { ListItem } from './list-item';

export const ButtonListItem = styled(function (props: {
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: VoidFunction;
  adornment?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, subtitle, disabled, onPress, adornment, children, style } =
    props;
  return (
    <View className='bg-card overflow-hidden rounded-xl' style={style}>
      <ListItem onPress={onPress} disabled={disabled}>
        <View className='flex flex-row items-center space-x-4 px-4 py-4'>
          {children}
          <View className='flex flex-1 flex-col'>
            <View className='flex flex-row items-center'>
              <Text className='text-text-primary text-sm font-medium'>
                {title}
              </Text>
              {adornment}
            </View>
            <Text className='text-text-secondary text-xs font-normal'>
              {subtitle}
            </Text>
          </View>
        </View>
      </ListItem>
    </View>
  );
});
