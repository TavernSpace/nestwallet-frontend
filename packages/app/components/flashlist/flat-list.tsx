import { FlashList, FlashListProps } from '@shopify/flash-list';
import { Ref, useCallback } from 'react';
import { Platform, FlatList as RNFlatList } from 'react-native';

export type RenderItemProps<T, E = never> = [E] extends [never]
  ? { item: T; index: number }
  : { item: T; index: number; extraData?: E };

// TODO: add proper typing for extraData
// TODO: data type is a bit messed up
export function FlatList<T>(
  props: Omit<FlashListProps<T>, 'renderItem'> & {
    estimatedItemSize: number;
    listRef?: Ref<FlashList<T>>;
    renderItem: (props: RenderItemProps<T>) => React.ReactElement | null;
  },
) {
  const {
    listRef,
    data,
    extraData,
    keyExtractor,
    renderItem,
    contentContainerStyle,
    numColumns,
    onEndReached,
    onEndReachedThreshold,
    ListFooterComponent,
    ListHeaderComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    horizontal,
    style,
    refreshControl,
    refreshing,
    onRefresh,
  } = props;

  const renderWeb = useCallback(
    (props: any) => renderItem({ ...props, extraData }),
    [extraData],
  );

  return Platform.OS === 'web' ? (
    <RNFlatList
      style={style}
      data={data}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={renderWeb}
      contentContainerStyle={contentContainerStyle}
      numColumns={numColumns}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      horizontal={horizontal}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  ) : (
    <FlashList
      {...props}
      ref={listRef}
      keyboardShouldPersistTaps='handled'
      onViewableItemsChanged={props.onViewableItemsChanged}
      nestedScrollEnabled={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}
