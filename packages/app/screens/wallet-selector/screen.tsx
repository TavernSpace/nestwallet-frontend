import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import {
  faClone,
  faEllipsis,
  faEye,
  faEyeSlash,
  faPen,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, StyleProp, ViewStyle } from 'react-native';
import { minTime } from '../../common/api/utils';
import { formatAddress } from '../../common/format/address';
import { useCopy } from '../../common/hooks/copy';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { VoidPromiseFunction } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { BaseButton } from '../../components/button/base-button';
import {
  FilledIconButton,
  IconButton,
  NeutralIconButton,
} from '../../components/button/icon-button';
import { RefreshButton } from '../../components/button/refresh-button';
import {
  DraggableFlatList,
  RenderItemProps,
} from '../../components/drag-list/draggable-flat-list';
import { FlatList } from '../../components/flashlist/flat-list';
import { Menu } from '../../components/menu';
import { MenuItem } from '../../components/menu/item';
import { SearchInput } from '../../components/search-input';
import { WalletItemSkeleton } from '../../components/skeleton/list-item';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import { parseError } from '../../features/errors';
import { refreshHapticAsync } from '../../features/haptic';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  IUpsertWalletInput,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { AddWalletButton } from '../../molecules/select/wallet-select/add-wallet';
import { WindowType, useNestWallet } from '../../provider/nestwallet';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';

interface WalletSelectorProps {
  wallets: IWallet[];
  selectedWallet: IWallet | null;
  onWalletPress: (wallet: IWallet) => void;
  onAddWalletPress: VoidFunction;
  onUpdateWallets: (input: IUpsertWalletInput[]) => Promise<void>;
  onEditWallet: (wallet: IWallet) => void;
  onRefresh: VoidPromiseFunction;
  onClose?: VoidFunction;
  DraggableList?: React.FC<{
    data: IWallet[];
    extraData: any;
    renderItem: (
      params: RenderItemProps<IWallet, boolean, () => void, any>,
    ) => JSX.Element;
    keyExtractor: (item: IWallet) => string;
    onDragEnd: (source: number, destination: number) => void;
    ListHeaderComponent?: React.ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }>;
}

export function WalletSelector(props: WalletSelectorProps) {
  const {
    wallets,
    selectedWallet,
    onRefresh,
    onWalletPress,
    onAddWalletPress,
    onUpdateWallets,
    onEditWallet,
    onClose,
    DraggableList,
  } = props;
  const { windowType } = useNestWallet();
  const { showSnackbar } = useSnackbar();
  const { bottom } = useSafeAreaInsets();

  const [searchInput, setSearchInput] = useState('');
  const [orderedWallets, setOrderedWallets] = useState(wallets);
  const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>({});
  const [managed, setManaged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { copy } = useCopy('Copied address!');

  const normalizedSearch = searchInput.toLowerCase();
  const filteredWallets = orderedWallets.filter((wallet) => {
    const isNameMatch = wallet.name.toLowerCase().includes(normalizedSearch);
    const isAddressMatch = wallet.address
      .toLowerCase()
      .includes(normalizedSearch);
    const includeWallet = showHidden ? true : !wallet.hidden;
    return includeWallet && (isNameMatch || isAddressMatch);
  });

  const resetHiddenMap = () => {
    setHiddenMap(
      wallets.reduce<Record<string, boolean>>((prev, cur) => {
        prev[cur.id] = cur.hidden;
        return prev;
      }, {}),
    );
  };

  const handleCancel = () => {
    resetHiddenMap();
    setManaged(false);
    setOrderedWallets(wallets);
  };

  const handleHideWallet = async (
    wallet: IWallet,
    managed: boolean,
    hiddenWallets: Record<string, boolean>,
    selectedWallet: IWallet | null,
  ) => {
    if (selectedWallet?.id === wallet.id) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: "Can't hide selected wallet!",
      });
    } else {
      setManaged(true);
      setHiddenMap({
        ...hiddenWallets,
        [wallet.id]: !hiddenWallets[wallet.id],
      });
    }
  };

  const handleManage = async () => {
    if (!managed) {
      setOrderedWallets(filteredWallets);
      return setManaged(true);
    }
    try {
      setLoading(true);
      const input = orderedWallets.map((wallet) => ({
        id: wallet.id,
        type: wallet.type,
        blockchain: wallet.blockchain,
        chainId: wallet.chainId,
        address: wallet.address,
        name: wallet.name,
        organizationId: wallet.organization.id,
        hidden: !!hiddenMap[wallet.id],
        rank: orderedWallets.indexOf(wallet),
      }));
      await onUpdateWallets(input);
      setManaged(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Successfully updated wallets!',
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (start: number, end: number) => {
    const result = Array.from(filteredWallets);
    const [removed] = result.splice(start, 1);
    result.splice(end, 0, removed!);
    if (!managed && start !== end) {
      setManaged(true);
    }
    setOrderedWallets(result);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await minTime(onRefresh(), 500);
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to get wallets',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setOrderedWallets(wallets);
    resetHiddenMap();
  }, [wallets]);

  const renderItem = useCallback(
    ({
      item,
      isActive,
      drag,
      extraData,
    }: RenderItemProps<
      IWallet,
      boolean,
      () => void,
      {
        hidden: Record<string, boolean>;
        selectedWallet: IWallet | null;
        managed: boolean;
        loading: boolean;
      }
    >) => {
      return (
        <WalletItem
          wallet={item}
          managed={extraData!.managed}
          isHeld={isActive}
          hidden={!!extraData!.hidden[item.id]}
          selected={extraData!.selectedWallet?.id === item.id}
          disabled={extraData!.loading}
          onPress={() => onWalletPress(item)}
          onLongPress={drag}
          onEdit={() => onEditWallet(item)}
          onHide={() =>
            handleHideWallet(
              item,
              extraData!.managed,
              extraData!.hidden,
              extraData!.selectedWallet,
            )
          }
          onCopy={() => copy(item.address)}
        />
      );
    },
    [],
  );

  const refreshControl =
    Platform.OS !== 'web' ? (
      <RefreshControl
        colors={[colors.primary]}
        progressBackgroundColor={colors.cardHighlight}
        tintColor={colors.primary}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    ) : undefined;

  useNavigationOptions({
    headerShown: true,
    headerTitle: 'Select Wallet',
    headerLeft: () =>
      !managed ? (
        onClose && (
          <IconButton
            icon={faChevronLeft}
            size={adjust(18, 2)}
            onPress={onClose}
            color={colors.textPrimary}
            disabled={loading}
          />
        )
      ) : (
        <BaseButton onPress={handleCancel} disabled={loading}>
          <View className='bg-failure/10 rounded-lg px-2 py-1'>
            <Text className='text-failure text-sm font-medium'>{'Cancel'}</Text>
          </View>
        </BaseButton>
      ),
    headerRight: () => (
      <View className='flex flex-row items-center space-x-2'>
        {managed ? (
          <BaseButton onPress={handleManage} disabled={loading}>
            <View className='bg-success/10 space-x-2 rounded-lg px-2 py-1'>
              {loading && (
                <ActivityIndicator
                  size={adjust(14, 2)}
                  color={colors.success}
                />
              )}
              <Text className='text-success text-sm font-medium'>{'Save'}</Text>
            </View>
          </BaseButton>
        ) : (
          <View className='flex flex-row space-x-2'>
            <RefreshButton refreshing={refreshing} onPress={handleRefresh} />
            <NeutralIconButton
              icon={showHidden ? faEye : faEyeSlash}
              onPress={() => setShowHidden(!showHidden)}
            />
          </View>
        )}
      </View>
    ),
  });

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset className='h-full w-full'>
        <View className='mt-2 flex flex-col'>
          <View className='px-4 pb-1'>
            <SearchInput
              inputProps={{
                placeholder: 'Name or Address',
                onChangeText: (value) => setSearchInput(value),
                value: searchInput,
              }}
              onClear={() => setSearchInput('')}
            />
          </View>
        </View>
        {filteredWallets.length > 0 ? (
          <View className='flex flex-1'>
            {/* DraggableFlatList doesn't work on web and is laggy on some Android */}
            {Platform.OS === 'ios' ? (
              <DraggableFlatList
                data={filteredWallets}
                extraData={{
                  hidden: hiddenMap,
                  selectedWallet,
                  managed,
                  loading,
                }}
                onDragBegin={!managed ? handleManage : undefined}
                onDragEnd={({ data }) => setOrderedWallets(data)}
                renderItem={renderItem}
                estimatedItemSize={adjust(64)}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                  <AddWalletButton onPress={onAddWalletPress} />
                }
                contentContainerStyle={{ paddingBottom: bottom }}
                refreshControl={refreshControl}
              />
            ) : DraggableList ? (
              <DraggableList
                data={filteredWallets}
                extraData={{
                  hidden: hiddenMap,
                  selectedWallet,
                  managed,
                  loading,
                }}
                renderItem={renderItem}
                onDragEnd={handleReorder}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                  <AddWalletButton onPress={onAddWalletPress} />
                }
                contentContainerStyle={{
                  overflow: 'scroll',
                  width: '100%',
                  height: '100%',
                  paddingBottom: bottom,
                }}
              />
            ) : (
              <FlatList
                data={filteredWallets}
                extraData={{
                  hidden: hiddenMap,
                  selectedWallet,
                  managed,
                  loading,
                }}
                renderItem={renderItem}
                estimatedItemSize={adjust(64)}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                  <AddWalletButton onPress={onAddWalletPress} />
                }
                contentContainerStyle={{ paddingBottom: bottom }}
                refreshControl={refreshControl}
              />
            )}
          </View>
        ) : (
          <EmptyState
            search={searchInput}
            windowType={windowType}
            onAddWallet={onAddWalletPress}
          />
        )}
      </ViewWithInset>
    </View>
  );
}

function WalletItem(props: {
  wallet: IWallet;
  managed: boolean;
  hidden: boolean;
  selected: boolean;
  isHeld?: boolean;
  disabled?: boolean;
  onPress: VoidFunction;
  onEdit: VoidFunction;
  onHide: VoidFunction;
  onCopy: VoidFunction;
  onLongPress?: VoidFunction;
}) {
  const {
    wallet,
    managed,
    isHeld,
    hidden,
    selected,
    disabled,
    onPress,
    onLongPress,
    onHide,
    onEdit,
    onCopy,
  } = props;

  const [showContextMenu, setShowContextMenu] = useState(false);

  return (
    <BaseButton
      onPress={hidden || managed ? () => {} : onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      scale={0.99}
      disabled={disabled}
    >
      <View
        className={cn('w-full items-center overflow-hidden px-2', {
          'opacity-50': hidden,
        })}
      >
        <View
          className={cn(
            'flex w-full flex-row items-center justify-between space-x-2 px-2 py-3',
            {
              'bg-card rounded-xl': selected,
              'bg-card/75 rounded-xl backdrop-blur-sm': isHeld,
            },
          )}
        >
          <View className='flex flex-1 flex-row items-center space-x-4'>
            <WalletAvatar
              wallet={wallet}
              safeBadge={wallet.proposalCount > 0}
              size={adjust(36)}
            />
            <View className='flex flex-1 flex-col'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {wallet.name}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(wallet.address)}
              </Text>
            </View>
          </View>
          <Menu
            visible={showContextMenu}
            onDismiss={() => setShowContextMenu(false)}
            anchor={
              <FilledIconButton
                icon={faEllipsis}
                size={adjust(20)}
                color={colors.textSecondary}
                backgroundColor={colors.cardHighlight}
                onPress={() => setShowContextMenu(true)}
                disabled={disabled}
              />
            }
            height={160}
            width={200}
            offsets={{ y: 24, x: 24 }}
          >
            <MenuItem
              title='Copy Address'
              subtitle={formatAddress(wallet.address)}
              icon={faClone}
              onPress={() => {
                setShowContextMenu(false);
                onCopy();
              }}
            />
            <MenuItem
              title='Edit Wallet'
              icon={faPen}
              onPress={() => {
                setShowContextMenu(false);
                onEdit();
              }}
            />
            <View className='h-2 items-center justify-center'>
              <View className='bg-divider h-[1px] w-full' />
            </View>
            <MenuItem
              title={hidden ? 'Show Wallet' : 'Hide Wallet'}
              icon={hidden ? faEye : faEyeSlash}
              iconColor={hidden ? colors.success : colors.failure}
              titleColor={hidden ? colors.success : colors.failure}
              onPress={() => {
                setShowContextMenu(false);
                onHide();
              }}
            />
          </Menu>
        </View>
      </View>
    </BaseButton>
  );
}

function EmptyState(props: {
  search: string;
  windowType?: WindowType;
  onAddWallet: VoidFunction;
}) {
  const { search, windowType, onAddWallet } = props;

  const [width, setWidth] = useState(SCREEN_WIDTH - 32);

  return (
    <View
      className='flex flex-col items-center justify-center'
      onLayout={
        windowType === WindowType.sidepanel
          ? (e) => setWidth(e.nativeEvent.layout.width)
          : undefined
      }
    >
      <View className='flex w-full flex-col items-center justify-center'>
        {search === '' && (
          <View className='w-full'>
            <AddWalletButton onPress={onAddWallet} />
          </View>
        )}
        <View className='flex w-full flex-col'>
          <WalletItemSkeleton fixed />
          <WalletItemSkeleton fixed />
        </View>
        <View className='mt-1 flex flex-col items-center justify-center space-y-2'>
          <Text className='text-text-primary text-sm font-medium'>
            {'No Wallets Found'}
          </Text>
          <Text
            className='text-center'
            style={{
              width,
            }}
          >
            <Text className='text-text-secondary text-xs font-normal'>
              {'Cannot find any wallets with '}
            </Text>
            <Text className='text-text-primary text-xs font-medium'>
              {search}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
