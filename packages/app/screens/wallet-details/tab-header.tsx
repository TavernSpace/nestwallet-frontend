import { Text } from '../../components/text';
import { View } from '../../components/view';

export function TabHeader(props: {
  title: string;
  adornment?: React.ReactNode;
}) {
  const { title, adornment } = props;
  return (
    <View className='flex h-10 w-full flex-row items-center justify-between px-2'>
      <View className='px-2'>
        <Text className='text-text-primary text-base font-medium'>{title}</Text>
      </View>
      {adornment ? adornment : <View />}
    </View>
  );
}
