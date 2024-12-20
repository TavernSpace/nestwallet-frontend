import { adjust } from '../../common/utils/style';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { Skeleton } from '../../components/skeleton';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';

export function QuickTradeLoadingScreen() {
  return (
    <ViewWithInset
      className='flex h-full w-full flex-col justify-between px-4'
      hasBottomInset={true}
    >
      <View className='flex flex-col space-y-2 pt-4'>
        <View className='flex flex-col space-y-4'>
          <View className='flex flex-row items-center space-x-2'>
            <Skeleton
              className='flex-1'
              width={'100%'}
              height={40}
              borderRadius={8}
            />
            <Skeleton width={40} height={40} borderRadius={8} />
            <Skeleton width={40} height={40} borderRadius={8} />
          </View>
          <Skeleton width={'100%'} height={24} borderRadius={9999} />
          <Skeleton width={'100%'} height={adjust(96, 8)} borderRadius={16} />
          <Skeleton width={'100%'} height={48} borderRadius={16} />
        </View>
        <View className='flex flex-row items-center justify-between space-x-2'>
          <View className='flex-1'>
            <Skeleton width={'100%'} height={36} borderRadius={8} />
          </View>
          <View className='flex-1'>
            <Skeleton width={'100%'} height={36} borderRadius={8} />
          </View>
          <View className='flex-1'>
            <Skeleton width={'100%'} height={36} borderRadius={8} />
          </View>
          <Skeleton width={36} height={36} borderRadius={8} />
        </View>
        <Skeleton width={'85%'} height={36} borderRadius={16} />
      </View>
      <Skeleton width={'100%'} height={BUTTON_HEIGHT} borderRadius={9999} />
    </ViewWithInset>
  );
}
