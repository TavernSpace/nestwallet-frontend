import { faListTree } from '@fortawesome/pro-solid-svg-icons';
import { formatAddress } from '../../../common/format/address';
import { ISignerWallet } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { BlockchainAvatar } from '../../../components/avatar/blockchain-avatar';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { TextButton } from '../../../components/button/text-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface DeriveMoreWalletsScreenProps {
  importedWallets: ISignerWallet[];
  onAddAddresses: VoidFunction;
}

export function DeriveMoreWalletsScreen(props: DeriveMoreWalletsScreenProps) {
  const { importedWallets, onAddAddresses } = props;
  const { language } = useLanguageContext();
  const blockchain = importedWallets[0]!.blockchain;

  const renderItem = (info: RenderItemProps<ISignerWallet>) => {
    const { item } = info;
    return (
      <ListItem disabled={true}>
        <View className='flex w-full flex-row items-center space-x-2 px-4 py-3'>
          <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
            <WalletAvatar
              wallet={item}
              safeBadge={item.proposalCount > 0}
              size={adjust(36, 8)}
            />
            <View className='flex flex-1 flex-col'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(item.address)}
              </Text>
            </View>
          </View>
          {!item.hasKeyring && (
            <View className='bg-primary/10 items-center justify-center rounded-full px-2 py-1'>
              <Text className='text-primary text-xs font-medium'>
                {localization.notImported[language]}
              </Text>
            </View>
          )}
        </View>
      </ListItem>
    );
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col space-y-4 px-4'>
        <View className='items-center py-2'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faListTree}
              color={colors.primary}
              size={48}
            />
          </View>
        </View>
        <Text className='text-text-secondary text-left text-sm font-normal'>
          {localization.deriveAdditionalAddresses[language]}
        </Text>
        <View className='flex flex-1 flex-col space-y-2 overflow-hidden'>
          <View className='flex flex-row items-center space-x-2'>
            <BlockchainAvatar blockchain={blockchain} size={adjust(20)} />
            <Text className='text-text-primary text-sm font-medium'>
              {localization.currentAddresses[language]}
              <Text className='text-text-secondary text-sm font-medium'>
                {` (${importedWallets.length})`}
              </Text>
            </Text>
          </View>
          <View className='flex-1'>
            <View className='bg-card max-h-full flex-row rounded-2xl'>
              <FlatList
                data={importedWallets}
                estimatedItemSize={adjust(64)}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
              />
            </View>
          </View>
        </View>
        <TextButton
          text={localization.addAddresses[language]}
          onPress={onAddAddresses}
        />
      </View>
    </ViewWithInset>
  );
}
