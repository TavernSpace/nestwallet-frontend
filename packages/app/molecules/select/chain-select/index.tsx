import { faAngleDown } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { adjust } from '../../../common/utils/style';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { InlineErrorTooltip } from '../../../components/input-error';
import { ListItem } from '../../../components/list/list-item';
import {
  RenderItemParam,
  RenderSelectedItemParam,
  Select,
} from '../../../components/select';
import { SelectEmptyState } from '../../../components/select/empty-state';
import { SelectedItem } from '../../../components/selected-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ChainId, ChainInfo } from '../../../features/chain';

export const ChainSelect = styled(_ChainSelect);

const renderDefaultSelectedChainItem = (
  params: RenderSelectedItemParam<ChainInfo, number>,
) => {
  const { disabled, options, value, show } = params;

  const chainInfo = options.find((item) => item.id === value);

  return (
    <SelectedItem onPress={show} disabled={disabled}>
      {chainInfo ? (
        <View className='flex flex-row items-center space-x-2'>
          <ChainAvatar chainInfo={chainInfo} size={adjust(24)} />
          <Text className='text-text-primary text-sm font-medium'>
            {chainInfo.name}
          </Text>
        </View>
      ) : (
        <Text className='text-text-primary py-1 text-sm font-medium'>
          Select a network
        </Text>
      )}
    </SelectedItem>
  );
};

export const renderSmallSelectedChainItem = (
  params: RenderSelectedItemParam<ChainInfo, number>,
) => {
  const { disabled, options, value, show } = params;

  const chainInfo = options.find((item) => item.id === value);

  return chainInfo ? (
    <BaseButton onPress={show} disabled={disabled} rippleEnabled={false}>
      <View className='flex flex-row items-center space-x-1.5'>
        <ChainAvatar chainInfo={chainInfo} size={adjust(20)} />
        <Text className='text-text-primary text-sm font-medium'>
          {chainInfo.name}
        </Text>
        {!disabled && (
          <FontAwesomeIcon
            color={colors.textSecondary}
            icon={faAngleDown}
            size={adjust(12, 2)}
          />
        )}
      </View>
    </BaseButton>
  ) : null;
};

const renderItem = ({
  item,
  value,
  onChange,
}: RenderItemParam<ChainInfo, number>) => {
  return (
    <ListItem
      className={cn({
        'bg-card-highlight': item.id === value,
      })}
      onPress={() => onChange(item)}
    >
      <View className='flex flex-row items-center space-x-4 px-4 py-3'>
        <ChainAvatar chainInfo={item} size={adjust(32)} />
        <Text className='text-text-primary text-sm font-medium'>
          {item.name}
        </Text>
      </View>
    </ListItem>
  );
};

function _ChainSelect(props: {
  value: ChainId;
  disabled?: boolean;
  isFullHeight?: boolean;
  hasTopInset?: boolean;
  chains: ChainInfo[];
  errorText?: string;
  style?: StyleProp<ViewStyle>;
  onChange?: (value: ChainInfo) => void;
  renderSelectedItem?: (
    param: RenderSelectedItemParam<ChainInfo, number>,
  ) => React.ReactNode;
}) {
  const {
    onChange,
    value,
    chains,
    disabled,
    isFullHeight,
    hasTopInset,
    errorText,
    style,
    renderSelectedItem = renderDefaultSelectedChainItem,
  } = props;

  return (
    <View style={style}>
      <Select
        disabled={disabled}
        options={chains}
        title='Select Network'
        emptyState={
          <SelectEmptyState subHeader='No Networks Found' paragraph='' />
        }
        value={value}
        isFullHeight={isFullHeight}
        hasTopInset={hasTopInset}
        onChange={onChange}
        renderSelectedItem={renderSelectedItem}
        renderItem={renderItem}
      />
      <View className='flex w-full flex-row items-center pt-1'>
        <InlineErrorTooltip isEnabled={!!errorText} errorText={errorText} />
      </View>
    </View>
  );
}
