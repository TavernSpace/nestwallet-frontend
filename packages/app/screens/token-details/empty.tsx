import { Skeleton } from '../../components/skeleton';
import { View } from '../../components/view';

export function TokenDetailsLoadingScreen() {
  const chartHeight = 212;

  return (
    <View className='absolute h-full w-full'>
      <View className='mx-4 flex flex-col space-y-4'>
        <View className='flex flex-col space-y-2'>
          <Skeleton width={'100%'} height={chartHeight} borderRadius={16} />
          <Skeleton width={'100%'} height={36} borderRadius={12} />
        </View>
        <Skeleton width={'100%'} height={80} borderRadius={16} />
        <Skeleton width={'100%'} height={80} borderRadius={16} />
        <Skeleton width={'100%'} height={80} borderRadius={16} />
      </View>
    </View>
  );
}
