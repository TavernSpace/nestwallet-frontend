import { faCircleNodes } from '@fortawesome/pro-light-svg-icons';
import { adjust, withSize } from '../../../common/utils/style';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import {
  ChainInfo,
  supportedChainsForBlockchain,
} from '../../../features/chain';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';

interface FilterContentProps {
  blockchain: IBlockchainType;
  chainId: number;
  onSelectChain: (chainId: number) => void;
  onClose: VoidFunction;
}

export function FilterContent(props: FilterContentProps) {
  const { blockchain, chainId, onSelectChain, onClose } = props;
  const { bottom } = useSafeAreaInsets();

  const handleSelectChain = (chainId: number) => {
    onSelectChain(chainId);
    onClose();
  };

  const size = adjust(36);

  const renderItem = ({ item }: RenderItemProps<ChainInfo>) => (
    <ChainItem chain={item} onPress={() => handleSelectChain(item.id)} />
  );

  return (
    <View className='flex h-full w-full flex-1 flex-col'>
      <ActionSheetHeader
        title='Filter Network'
        onClose={onClose}
        type='fullscreen'
      />
      <FlatList
        data={supportedChainsForBlockchain[blockchain]}
        estimatedItemSize={adjust(64)}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <ListItem onPress={() => handleSelectChain(0)}>
            <View className='flex w-full flex-row items-center space-x-4 rounded-lg px-4 py-3'>
              <View
                className='bg-card-highlight items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faCircleNodes}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              <View className='flex flex-col'>
                <View className='flex flex-row items-center space-x-2'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {'All Networks'}
                  </Text>
                </View>
              </View>
            </View>
          </ListItem>
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: bottom }}
      />
    </View>
  );
}

function ChainItem(props: { chain: ChainInfo; onPress: VoidFunction }) {
  const { chain, onPress } = props;

  const size = adjust(36);

  return (
    <ListItem onPress={onPress}>
      <View className='flex w-full flex-row items-center space-x-4 rounded-lg px-4 py-3'>
        <ChainAvatar chainInfo={chain} size={size} />
        <View className='flex flex-col'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-medium'>
              {chain.name}
            </Text>
          </View>
        </View>
      </View>
    </ListItem>
  );
}
