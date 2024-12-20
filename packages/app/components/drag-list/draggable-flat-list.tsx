import { useCallback } from 'react';
import {
  DraggableFlatListProps,
  NestableDraggableFlatList,
  NestableScrollContainer,
} from 'react-native-draggable-flatlist';

export type RenderItemProps<T, A, D, E = never> = [E] extends [never]
  ? { item: T }
  : {
      item: T;
      isActive?: A;
      drag?: D;
      extraData?: E;
    };

// TODO: add proper typing for extraData
// TODO: data type is a bit messed up
export function DraggableFlatList<T, A, D>(
  props: Omit<DraggableFlatListProps<T>, 'renderItem'> & {
    estimatedItemSize: number;
    renderItem: (props: RenderItemProps<T, A, D>) => React.ReactElement | null;
  },
) {
  const {
    data,
    extraData,
    keyExtractor,
    renderItem,
    contentContainerStyle,
    numColumns,
    onDragBegin,
    onDragEnd,
    onEndReached,
    onEndReachedThreshold,
    ListFooterComponent,
    ListHeaderComponent,
    ItemSeparatorComponent,
    style,
    refreshControl,
    refreshing,
    onRefresh,
  } = props;

  const render = useCallback(
    (props: any) => renderItem({ ...props, extraData }),
    [extraData],
  );

  return (
    <NestableScrollContainer
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
    >
      <NestableDraggableFlatList
        style={style}
        data={data}
        extraData={extraData}
        keyExtractor={keyExtractor}
        renderItem={render}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={contentContainerStyle}
        numColumns={numColumns}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        autoscrollSpeed={5}
        autoscrollThreshold={20}
        onEndReached={onEndReached}
        onDragBegin={onDragBegin}
        onDragEnd={onDragEnd}
        onEndReachedThreshold={onEndReachedThreshold}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        refreshControl={refreshControl}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </NestableScrollContainer>
  );
}
