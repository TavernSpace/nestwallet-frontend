import { isNil } from 'lodash';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { empty } from '../../common/utils/functions';
import { adjust } from '../../common/utils/style';
import { ActionSheet } from '../../components/sheet';
import { View } from '../../components/view';
import { useSafeAreaInsets } from '../../features/safe-area';
import { FlatList, RenderItemProps } from '../flashlist/flat-list';
import { ActionSheetHeader } from '../sheet/header';

export interface RenderSelectedItemParam<Option, Value> {
  disabled?: boolean;
  options: Option[];
  value?: Value;
  show: VoidFunction;
}

export interface RenderItemParam<Option, Value> {
  item: Option;
  options: Option[];
  value?: Value;
  onChange: (value: Option) => void;
}

export interface RenderChildrenParam {
  hide: VoidFunction;
}

export function Select<Option, Value>(props: {
  disabled?: boolean;
  options: Option[];
  title: string;
  emptyState?: React.ReactNode;
  value?: Value;
  isFullHeight?: boolean;
  hasTopInset?: boolean;
  onChange?: (value: Option) => void;
  renderSelectedItem?: (
    param: RenderSelectedItemParam<Option, Value>,
  ) => React.ReactNode;
  renderItem: (param: RenderItemParam<Option, Value>) => React.ReactNode;
  renderChildren?: (param: RenderChildrenParam) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    disabled,
    options,
    emptyState,
    title,
    style,
    value,
    isFullHeight = false,
    hasTopInset,
    onChange = empty,
    renderSelectedItem,
    renderChildren,
    renderItem,
  } = props;
  const { bottom } = useSafeAreaInsets();

  const [isShowing, setIsShowing] = useState(false);

  const handleChange = (option: Option) => {
    onChange(option);
    setIsShowing(false);
  };

  const render = ({
    item,
    extraData,
  }: RenderItemProps<Option, { options: Option[]; value: Value }>) => (
    <View>
      {renderItem({
        item,
        options: extraData!.options,
        value: extraData!.value,
        onChange: handleChange,
      })}
    </View>
  );

  return (
    <View style={style}>
      {renderSelectedItem?.({
        disabled,
        options,
        value,
        show: () => setIsShowing(true),
      })}
      <ActionSheet
        isShowing={isShowing}
        onClose={() => setIsShowing(false)}
        isFullHeight={isFullHeight}
        hasTopInset={isNil(hasTopInset) ? isFullHeight : hasTopInset}
        hasBottomInset={false}
      >
        <ActionSheetHeader
          title={title}
          onClose={() => setIsShowing(false)}
          type={isFullHeight ? 'fullscreen' : 'normal'}
        />
        {options.length < 1 ? (
          emptyState
        ) : (
          <FlatList
            data={options}
            extraData={{ options, value }}
            estimatedItemSize={adjust(64)}
            renderItem={render}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{
              paddingBottom: bottom,
            }}
          />
        )}
        {renderChildren?.({
          hide: () => setIsShowing(false),
        })}
      </ActionSheet>
    </View>
  );
}
