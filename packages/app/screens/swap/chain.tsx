import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { adjust } from '../../common/utils/style';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { BaseButton } from '../../components/button/base-button';
import {
  FlatList,
  RenderItemProps,
} from '../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ListItem } from '../../components/list/list-item';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import {
  ChainId,
  ChainInfo,
  getChainInfo,
  swapSupportedChainsForBlockchain,
} from '../../features/chain';
import { useSafeAreaInsets } from '../../features/safe-area';
import { IBlockchainType } from '../../graphql/client/generated/graphql';

export const ChainSection = styled(function (props: {
  chainId: number;
  disabled?: boolean;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { chainId, disabled = false, onPress, style } = props;

  const chainInfo = getChainInfo(chainId);

  return (
    <View style={style}>
      <BaseButton
        className='overflow-hidden'
        onPress={onPress}
        disabled={disabled}
      >
        <View
          className='bg-card flex flex-row items-center justify-between space-x-2 rounded-xl px-4'
          style={{ paddingVertical: Platform.OS === 'web' ? 8 : 10 }}
        >
          <ChainAvatar chainInfo={chainInfo} size={adjust(36)} border={false} />
          {!disabled && (
            <FontAwesomeIcon
              icon={faChevronRight}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
          )}
        </View>
      </BaseButton>
    </View>
  );
});

export function ChainSelectSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
  onChainChange: (chainId: number) => void;
}) {
  const { isShowing, onClose, onChainChange } = props;
  const { bottom } = useSafeAreaInsets();

  const renderChainItem = ({ item }: RenderItemProps<ChainInfo>) => (
    <ListItem
      key={item.id}
      onPress={() => {
        onChainChange(item.id);
        onClose();
      }}
    >
      <View className='flex flex-row items-center space-x-4 px-4 py-3'>
        <ChainAvatar chainInfo={item} size={36} />
        <Text className='text-text-primary text-sm font-medium'>
          {item.name}
        </Text>
      </View>
    </ListItem>
  );

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasTopInset={Platform.OS === 'android'}
      hasBottomInset={false}
    >
      <ActionSheetHeader
        title='Select Destination Network'
        onClose={onClose}
        type='fullscreen'
      />
      <View className='flex-1'>
        <FlatList
          data={swapSupportedChainsForBlockchain[IBlockchainType.Evm]
            .concat(getChainInfo(ChainId.Solana))
            .sort((c0, c1) => c1.swapPriority - c0.swapPriority)}
          renderItem={renderChainItem}
          keyExtractor={(chain) => chain.id.toString()}
          estimatedItemSize={64}
          contentContainerStyle={{ paddingBottom: bottom }}
        />
      </View>
    </ActionSheet>
  );
}
