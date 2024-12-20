import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { Skeleton } from '.';
import { SCREEN_WIDTH } from '../../design/constants';
import { View } from '../view';

export function AssetListItemSkeleton(props: { fixed?: boolean }) {
  const { fixed } = props;
  return (
    <View className='flex flex-row items-center justify-between space-x-2 px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={36} height={36} borderRadius={9999} fixed={fixed} />
        <View className='flex-1 space-y-1 pr-4'>
          <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
          <Skeleton width={40} height={10} borderRadius={4} fixed={fixed} />
        </View>
      </View>
      <View className='flex-shrink-0 flex-col items-end space-y-1 text-right'>
        <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
        <Skeleton width={50} height={10} borderRadius={4} fixed={fixed} />
      </View>
    </View>
  );
}

export function NFTBlockItemSkeleton(props: { size: number; fixed?: boolean }) {
  const { size, fixed } = props;
  return (
    <View className='flex flex-col space-y-2 overflow-hidden'>
      <Skeleton width={size} height={size} borderRadius={16} fixed={fixed} />
      <Skeleton width={70} height={16} borderRadius={4} fixed={fixed} />
    </View>
  );
}

export function HistoryListItemSkeleton(props: { fixed?: boolean }) {
  const { fixed } = props;
  return (
    <View className='flex flex-row items-center justify-between space-x-2 px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={36} height={36} borderRadius={9999} fixed={fixed} />
        <View className='flex-1 space-y-1 pr-4'>
          <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
          <Skeleton width={40} height={10} borderRadius={4} fixed={fixed} />
        </View>
      </View>
      <View className='items-end'>
        <Skeleton width={70} height={16} borderRadius={4} fixed={fixed} />
      </View>
    </View>
  );
}

export function QueueListItemSkeleton(props: { fixed?: boolean }) {
  const { fixed } = props;
  return (
    <View className='flex flex-row items-center justify-between space-x-2 px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={36} height={36} borderRadius={9999} fixed={fixed} />
        <View className='flex-1 space-y-1 pr-4'>
          <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
          <Skeleton width={40} height={10} borderRadius={4} fixed={fixed} />
        </View>
      </View>
      <View className='items-end'>
        <Skeleton width={60} height={20} borderRadius={4} fixed={fixed} />
      </View>
    </View>
  );
}

export function WalletItemSkeleton(props: { fixed?: boolean }) {
  const { fixed } = props;
  return (
    <View className='flex w-full flex-row items-center justify-between space-x-2 px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={36} height={36} borderRadius={9999} fixed={fixed} />
        <View className='flex-1 space-y-1.5 pr-4'>
          <Skeleton width={120} height={16} borderRadius={4} fixed={fixed} />
          <Skeleton width={90} height={12} borderRadius={4} fixed={fixed} />
        </View>
      </View>
    </View>
  );
}

export function QuestListItemSkeleton(props: { fixed?: boolean }) {
  const { fixed } = props;
  return (
    <View className='flex flex-row items-center justify-between space-x-2 px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={36} height={36} borderRadius={9999} fixed={fixed} />
        <View className='flex-1 space-y-1 pr-4'>
          <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
          <Skeleton width={40} height={10} borderRadius={4} fixed={fixed} />
        </View>
      </View>
      <View className='flex-shrink-0 flex-col items-end space-y-1 text-right'>
        <Skeleton width={70} height={12} borderRadius={4} fixed={fixed} />
        <Skeleton width={50} height={10} borderRadius={4} fixed={fixed} />
      </View>
    </View>
  );
}

export const BookmarkSkeleton = styled(function (props: {
  fixed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { fixed, style } = props;

  const width = (SCREEN_WIDTH - 80) / 4;
  const height = width;

  return (
    <View style={style}>
      {fixed ? (
        <View className='bg-card rounded-2xl' style={{ height, width }} />
      ) : (
        <Skeleton width={width} height={height} borderRadius={16} />
      )}
    </View>
  );
});

export const BrowserHistorySkeleton = styled(function (props: {
  fixed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { fixed, style } = props;

  const width = (SCREEN_WIDTH - 48) / 2;

  return (
    <View style={style}>
      {fixed ? (
        <View
          className='bg-card rounded-3xl'
          style={{ height: width, width }}
        />
      ) : (
        <Skeleton width={width} height={width} borderRadius={24} />
      )}
    </View>
  );
});
