import { faBolt, faCheck, faWallet } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { Platform } from 'react-native';
import { formatAddress } from '../../../../common/format/address';
import { formatCrypto } from '../../../../common/format/number';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
} from '../../../../common/types';
import { onLoadable } from '../../../../common/utils/query';
import { adjust, withSize } from '../../../../common/utils/style';
import { WalletAvatar } from '../../../../components/avatar/wallet-avatar';
import {
  FlatList,
  RenderItemProps,
} from '../../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ListItem } from '../../../../components/list/list-item';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { WalletItemSkeleton } from '../../../../components/skeleton/list-item';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { getChainInfo } from '../../../../features/chain';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface SafeSelectExecutorSheetProps {
  chainId: number;
  executor?: ISignerWallet | null;
  executors: IWalletWithLoadableBalance[];
  isShowing: boolean;
  onClose: VoidFunction;
  onSelectExecutor: (wallet: ISignerWallet) => void;
  onRelay?: VoidFunction;
}

export function SafeSelectExecutorSheet(props: SafeSelectExecutorSheetProps) {
  const {
    chainId,
    executor,
    executors,
    isShowing,
    onClose,
    onRelay,
    onSelectExecutor,
  } = props;
  const { bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<
    IWalletWithLoadableBalance,
    { chainId: number; executor?: ISignerWallet | null }
  >) => (
    <ListItem onPress={() => onSelectExecutor(item.wallet)}>
      <ExecutorItem
        chainId={extraData!.chainId}
        wallet={item}
        isSelected={extraData!.executor?.address === item.wallet.address}
      />
    </ListItem>
  );

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasTopInset={true}
      hasBottomInset={false}
    >
      <View className='flex h-full w-full flex-1 flex-col'>
        <ActionSheetHeader
          title={localization.selectExecutor[language]}
          onClose={onClose}
          type='fullscreen'
        />
        {executors.length === 0 ? (
          <EmptyState />
        ) : (
          <View className='flex flex-1 flex-col'>
            <FlatList
              data={executors}
              extraData={{ chainId, executor }}
              estimatedItemSize={adjust(64)}
              renderItem={renderItem}
              ListHeaderComponent={() =>
                onRelay && (
                  <ListItem onPress={onRelay}>
                    <RelayItem isSelected={executor === null} />
                  </ListItem>
                )
              }
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: bottom }}
            />
          </View>
        )}
      </View>
    </ActionSheet>
  );
}

function ExecutorItem(props: {
  chainId: number;
  wallet: IWalletWithLoadableBalance;
  isSelected?: boolean;
}) {
  const { chainId, wallet, isSelected } = props;
  const chainInfo = getChainInfo(chainId);
  const { language } = useLanguageContext();

  const size = adjust(20, 2);
  const iconSize = adjust(12, 2);

  return (
    <View className='flex w-full flex-row items-center justify-between px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4'>
        <View className='relative inline-block'>
          <WalletAvatar wallet={wallet.wallet} size={adjust(36)} />
        </View>
        <View className='flex flex-1 flex-col'>
          <View className='flex-1 overflow-hidden'>
            <Text className='text-text-primary truncate text-sm font-medium'>
              {wallet.wallet.name}
            </Text>
          </View>
          <View className='flex-1 overflow-hidden'>
            <Text className='text-text-secondary truncate text-xs font-normal'>
              {formatAddress(wallet.wallet.address)}
            </Text>
          </View>
        </View>
      </View>
      <View className='flex flex-row items-center space-x-2 pr-2'>
        <View className='flex-none'>
          <Text className='text-text-secondary text-sm font-medium'>
            {onLoadable(wallet.balance)(
              () => localization.loading[language],
              () => localization.error[language],
              (balance) =>
                `${formatCrypto(balance, 18)} ${
                  chainInfo.nativeCurrency.symbol
                }`,
            )}
          </Text>
        </View>
        <View className='flex-none'>
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-primary': isSelected,
              'bg-card': !isSelected,
            })}
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faCheck}
              color={
                isSelected ? colors.textButtonPrimary : colors.textSecondary
              }
              size={iconSize}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function RelayItem(props: { isSelected?: boolean }) {
  const { isSelected } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex w-full flex-row items-center justify-between px-4 py-4'>
      <View className='flex flex-1 flex-row items-center space-x-4'>
        <View
          className='bg-primary/10 items-center justify-center rounded-full'
          style={withSize(adjust(36))}
        >
          <FontAwesomeIcon
            icon={faBolt}
            size={adjust(24, 2)}
            color={colors.primary}
          />
        </View>
        <View className='flex flex-1 flex-col'>
          <Text className='text-text-primary truncate text-sm font-bold'>
            {localization.relay[language]}
          </Text>
        </View>
      </View>
      <View className='flex flex-row items-center space-x-2 pr-2'>
        <View className='flex-none'>
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-primary/10': isSelected,
              'bg-card-highlight': !isSelected,
            })}
            style={withSize(adjust(20, 2))}
          >
            {isSelected && (
              <FontAwesomeIcon
                icon={faCheck}
                color={isSelected ? colors.primary : colors.textSecondary}
                size={adjust(12, 2)}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  const { language } = useLanguageContext();
  return (
    <View className='flex flex-col'>
      <View className='flex flex-col'>
        <WalletItemSkeleton fixed={true} />
        <WalletItemSkeleton fixed={true} />
      </View>
      <View className='-mt-2 flex flex-col items-center'>
        <View className='bg-primary/10 h-16 w-16 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faWallet}
            size={adjust(36)}
            color={colors.primary}
          />
        </View>
        <View className='flex flex-col items-center justify-center space-y-2 px-4 pt-4'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.noValidExecutors[language]}
          </Text>
          <Text className='text-text-secondary text-center text-xs font-normal'>
            {`${localization.noWalletsWithGas[language]}${
              Platform.OS === 'web'
                ? ''
                : localization.hardwareBrowserOnly[language]
            }`}
          </Text>
        </View>
      </View>
    </View>
  );
}
