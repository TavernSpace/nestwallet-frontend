import {
  FlashList,
  FlashListProps,
  ListRenderItemInfo,
} from '@shopify/flash-list';
import _ from 'lodash';
import { useMemo } from 'react';
import {
  DefaultSectionT,
  Platform,
  SectionList as RNSectionList,
  SectionListData,
} from 'react-native';

type InternalItem<ItemT, SectionT> = {
  type: 'item';
  item: ItemT;
  section: SectionListData<ItemT, SectionT>;
};

type InternalSection<ItemT, SectionT> = SectionListData<ItemT, SectionT> & {
  type: 'section';
  index: number;
};

type InternalData<ItemT, SectionT> =
  | InternalItem<ItemT, SectionT>
  | InternalSection<ItemT, SectionT>;

type SectionListFlashListProps<ItemT> = Omit<
  Omit<
    Omit<Omit<FlashListProps<ItemT>, 'data'>, 'getItemType'>,
    'overrideItemLayout'
  >,
  'renderItem'
>;

// TODO: support extra data for this
export function SectionList<ItemT, SectionT = DefaultSectionT>(
  props: SectionListFlashListProps<ItemT> & {
    keyExtractor: (item: ItemT, index: number) => string;
    sections: ReadonlyArray<SectionListData<ItemT, SectionT>>;
    renderItem: (info: {
      item: ItemT;
      index: number;
      section: SectionListData<ItemT, SectionT>;
    }) => React.ReactElement | null;
    renderSectionHeader: (info: {
      section: SectionListData<ItemT, SectionT>;
    }) => React.ReactElement | null;
    estimatedItemSize: number;
    stickySectionHeader?: boolean;
  },
) {
  const {
    sections,
    keyExtractor,
    renderItem,
    extraData,
    renderSectionHeader,
    stickySectionHeader,
    contentContainerStyle,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    onEndReached,
    refreshControl,
    onRefresh,
    refreshing,
    onViewableItemsChanged,
    ...sectionListProps
  } = props;

  const data = useMemo(() => {
    return sections.flatMap((section, index) => {
      const sectionRow = { type: 'section', index, ...section };
      const itemRows = section.data.map((item) => {
        return { type: 'item', item, section };
      });
      return [sectionRow, ...itemRows];
    }) as Array<InternalData<ItemT, SectionT>>;
  }, [props.sections]);

  const handleKeyExtractor = (
    item: InternalData<ItemT, SectionT>,
    index: number,
  ) => {
    if (_.isObject(item) && item.type === 'section') {
      const section = item as InternalSection<ItemT, SectionT>;
      return `section:${section.index}`;
    } else if (keyExtractor) {
      return keyExtractor(item.item, index);
    }
    return `item:${index.toString()}`;
  };

  const handleRenderItem = (
    info: ListRenderItemInfo<InternalData<ItemT, SectionT>>,
  ) => {
    const { item } = info;
    if (_.isObject(item) && item.type === 'section') {
      const section = item as SectionListData<ItemT, SectionT>;
      return renderSectionHeader({ section });
    } else if (renderItem) {
      return renderItem({
        item: item.item,
        index: info.index,
        section: item.section,
      });
    }
    return null;
  };

  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = [];
    if (stickySectionHeader) {
      let counter = 0;
      sections.forEach((section) => {
        indices.push(counter);
        counter += section.data.length + 1;
      });
    }
    return indices;
  }, [sections, stickySectionHeader]);

  return Platform.OS === 'web' ? (
    <RNSectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      extraData={extraData}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onEndReached={onEndReached}
      refreshControl={refreshControl}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      stickySectionHeadersEnabled={stickySectionHeader ?? false}
    />
  ) : (
    <FlashList
      {...sectionListProps}
      data={data}
      keyExtractor={handleKeyExtractor}
      renderItem={handleRenderItem}
      extraData={extraData}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onEndReached={onEndReached}
      refreshControl={refreshControl}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onViewableItemsChanged={onViewableItemsChanged}
      nestedScrollEnabled={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={stickyHeaderIndices}
    />
  );
}
