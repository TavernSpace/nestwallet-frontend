import { useState } from 'react';
import { formatAddress } from '../../../common/format/address';
import { adjust } from '../../../common/utils/style';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { ListItem } from '../../../components/list/list-item';
import { SearchInput } from '../../../components/search-input';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { WalletItemSkeleton } from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { useSafeAreaInsets } from '../../../features/safe-area';
import {
  IBlockchainType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { useAudioContext } from '../../../provider/audio';
import { AddWalletButton } from './add-wallet';

export function WalletSelectContent(props: {
  wallets: IWallet[];
  walletType?: IBlockchainType;
  onClose: VoidFunction;
  onSelectWallet: (wallet: IWallet) => void;
  onCreateWallet?: VoidFunction;
  ListHeader?: React.ComponentType;
}) {
  const { wallets, onClose, onSelectWallet, onCreateWallet, ListHeader } =
    props;
  const { bottom } = useSafeAreaInsets();
  const { pressSound } = useAudioContext().sounds;

  const [searchInput, setSearchInput] = useState('');

  const normalizedSearch = searchInput.toLowerCase();
  const filteredWallets = wallets.filter(
    (wallet) =>
      !wallet.hidden &&
      (wallet.name.toLowerCase().includes(normalizedSearch) ||
        wallet.address.toLowerCase().includes(normalizedSearch)),
  );

  const renderItem = ({ item }: RenderItemProps<IWallet, never>) => {
    return (
      <ListItem onPress={() => onSelectWallet(item)} pressSound={pressSound}>
        <View className='flex flex-row items-center space-x-2 px-4 py-3'>
          <WalletAvatar wallet={item} size={adjust(36)} />
          <View className='flex flex-col pl-2'>
            <Text className='text-text-primary text-sm font-normal'>
              {item.name}
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatAddress(item.address)}
            </Text>
          </View>
        </View>
      </ListItem>
    );
  };

  return (
    <View className='flex h-full flex-col'>
      <ActionSheetHeader
        title='Select Wallet'
        onClose={onClose}
        closeSound={pressSound}
        type='fullscreen'
      />
      <View className='flex flex-col space-y-3 px-4 pb-2'>
        <SearchInput
          inputProps={{
            placeholder: 'Name or Address',
            onChangeText: (value) => setSearchInput(value),
            value: searchInput,
          }}
          onClear={() => setSearchInput('')}
        />
      </View>
      <FlatList
        data={filteredWallets}
        ListEmptyComponent={() => (
          <View className='flex w-full flex-col items-center justify-center'>
            {searchInput === '' && onCreateWallet && (
              <View className='mt-1 w-full'>
                <AddWalletButton onPress={onCreateWallet} />
              </View>
            )}
            <WalletItemSkeleton fixed />
            <WalletItemSkeleton fixed />
            {searchInput !== '' && (
              <View className='flex flex-col items-center justify-center px-8 pt-1'>
                <Text className='text-text-primary text-sm font-medium'>
                  No Wallets Found
                </Text>
                <Text className='text-text-secondary mt-2 text-center text-xs font-normal'>
                  {'No wallets match the query '}
                  <Text className='text-text-primary text-xs font-medium'>
                    {searchInput}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        )}
        ListHeaderComponent={ListHeader ? ListHeader : undefined}
        estimatedItemSize={adjust(64)}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: bottom }}
      />
    </View>
  );
}
