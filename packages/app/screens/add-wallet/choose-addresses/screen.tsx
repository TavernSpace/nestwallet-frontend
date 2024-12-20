import { faCaretDown, faCheck } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useMemo, useRef, useState } from 'react';
import { formatAddress } from '../../../common/format/address';
import { formatCrypto } from '../../../common/format/number'; //TODO (Bill): This is not the right thing to use
import { useEffectAfterTransition } from '../../../common/hooks/animation';
import { Account, ISignerWallet, LedgerPathType } from '../../../common/types';
import { recordify } from '../../../common/utils/functions';
import { adjust, withSize } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { WalletItemSkeleton } from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import {
  defaultSvmParentPath,
  defaultTvmParentPath,
} from '../../../features/wallet/seedphrase';
import {
  IBlockchainType,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { PathSelectSheet } from './sheet';

const pathOptions = {
  [IBlockchainType.Evm]: [
    { name: LedgerPathType.LedgerLiveEvm, pathDerivation: "m/44'/60'/0'/0/0" },
    { name: LedgerPathType.DefaultEvm, pathDerivation: "m/44'/60'/0'/0" },
  ],
  [IBlockchainType.Svm]: [
    {
      name: LedgerPathType.DefaultSvm,
      pathDerivation: `${defaultSvmParentPath}/0'`,
    },
  ],
  [IBlockchainType.Tvm]: [
    {
      name: LedgerPathType.DefaultTvm,
      pathDerivation: `${defaultTvmParentPath}/0'`,
    },
  ],
};

interface AccountWithBalance {
  data: Account;
  balance: string;
}

interface ImportWalletChooseAddressesScreenProps {
  blockchain: IBlockchainType;
  walletType: IWalletType;
  fetchWallet: (
    curAddress: number,
    numAddresses: number,
    pathType?: LedgerPathType,
  ) => Promise<Array<AccountWithBalance>>;
  onContinue: (keyringIdentifier: string, accounts: Account[]) => void;
  importedWallets: ISignerWallet[];
}

export function ImportWalletChooseAddressesScreen(
  props: ImportWalletChooseAddressesScreenProps,
) {
  const { blockchain, fetchWallet, onContinue, importedWallets, walletType } =
    props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [wallets, setWallets] = useState<Array<AccountWithBalance>>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LedgerPathType>(
    blockchain === IBlockchainType.Evm
      ? LedgerPathType.LedgerLiveEvm
      : blockchain === IBlockchainType.Svm
      ? LedgerPathType.DefaultSvm
      : LedgerPathType.DefaultTvm,
  );

  const fetchRef = useRef(false);
  const walletMap = useMemo(
    () => recordify(importedWallets, (wallet) => wallet.address),
    [importedWallets],
  );
  const numAddresses = 10;

  useEffectAfterTransition(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchAddress();
    }
  });

  const handleSelectPath = async (key: LedgerPathType) => {
    setSelectedPath(key);
    setShowFilterSheet(false);
    await resetWallets(key);
  };

  const handleContinue = () => {
    if (wallets.length === 0 || selectedAccounts.length === 0) {
      return;
    } else if (selectedAccounts.length > 10) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.maxWalletsError[language],
      });
    } else {
      const keyringIdentifier = wallets[0]!.data.address;
      onContinue(keyringIdentifier, selectedAccounts);
    }
  };

  const handleError = (err: unknown) => {
    const appError = parseError(
      typeof err === 'object' ? { ...err, blockchain } : err,
    );
    setError(appError.message);
    if (
      walletType === IWalletType.Ledger ||
      walletType === IWalletType.Trezor
    ) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: appError.message,
      });
    }
  };

  const resetWallets = async (key: LedgerPathType) => {
    setWallets([]);
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const newWallets = await fetchWallet(0, numAddresses, key);
      setWallets((cur) => [...cur, ...newWallets]);
      setError(undefined);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddress = async () => {
    // device is locked while loading, do not access ledger concurrently
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const newWallets = await fetchWallet(
        wallets.length,
        numAddresses,
        selectedPath,
      );
      setWallets((cur) => [...cur, ...newWallets]);
      setError(undefined);
    } catch (err) {
      handleError(err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = (item: Account, isSelected: boolean) => {
    if (isSelected) {
      const newSelection = selectedAccounts.filter((account) => {
        return account.address !== item.address;
      });
      setSelectedAccounts(newSelection);
    } else {
      const newSelection = [...selectedAccounts, item];
      setSelectedAccounts(newSelection);
    }
  };

  const renderItem = (
    info: RenderItemProps<
      AccountWithBalance,
      { selectedAccounts: Account[]; walletMap: Record<string, ISignerWallet> }
    >,
  ) => {
    const { item, extraData } = info;
    const isSelected = !!extraData!.selectedAccounts.find(
      (account) => item.data.address === account.address,
    );
    const importedWallet = extraData!.walletMap[item.data.address];
    const hasKeyring = importedWallet && importedWallet.hasKeyring;
    const importedMissingKeyring = importedWallet && !importedWallet.hasKeyring;
    const isPrivateKey =
      importedWallet && importedWallet.type === IWalletType.PrivateKey;
    const currency = onBlockchain(blockchain)(
      () => localization.eth[language],
      () => localization.sol[language],
      () => localization.ton[language],
    );

    return (
      <ListItem
        onPress={() => handlePress(item.data, isSelected)}
        disabled={hasKeyring}
        key={info.item.data.address}
      >
        <View className='flex flex-row items-center justify-between px-4 py-3'>
          <View className='flex flex-row items-start space-x-4'>
            <Text className='text-text-primary text-sm font-bold'>
              {item.data.derivationIndex! + 1}
            </Text>
            <View>
              <Text className='text-text-primary text-sm font-medium'>
                {formatAddress(item.data.address)}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {item.balance || formatCrypto(0, 18)} {currency}
              </Text>
            </View>
          </View>
          {hasKeyring ? (
            <View className='bg-success/10 items-center justify-center rounded-full px-2 py-1'>
              <Text className='text-success text-xs font-medium'>
                {localization.imported[language]}
              </Text>
            </View>
          ) : (
            <View className='flex flex-row items-center space-x-2'>
              {isPrivateKey ? (
                <View className='bg-warning/10 items-center justify-center rounded-full px-2 py-1'>
                  <Text className='text-warning text-xs font-medium'>
                    {localization.wrongType[language]}
                  </Text>
                </View>
              ) : importedMissingKeyring ? (
                <View className='bg-primary/10 items-center justify-center rounded-full px-2 py-1'>
                  <Text className='text-primary text-xs font-medium'>
                    {localization.reimport[language]}
                  </Text>
                </View>
              ) : null}
              {!isPrivateKey && (
                <View
                  className={cn(
                    'flex flex-row items-center justify-center rounded-full',
                    {
                      'bg-primary/10': isSelected,
                      'bg-card-highlight-secondary': !isSelected,
                    },
                  )}
                  style={withSize(adjust(20, 2))}
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={adjust(12, 2)}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    className='outline-none'
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </ListItem>
    );
  };

  const ListEnd = () => {
    return isLoading ? (
      <View className='flex h-full w-full flex-col items-center justify-start'>
        <WalletItemSkeleton />
      </View>
    ) : (
      <View />
    );
  };

  return (
    <ViewWithInset
      className='absolute h-full w-full space-y-2 px-4'
      hasBottomInset={true}
    >
      <View className='flex flex-1 flex-col'>
        {walletType === IWalletType.Ledger && (
          <BaseButton
            className='mt-2'
            disabled={isLoading}
            onPress={() => setShowFilterSheet(true)}
          >
            <View className='bg-card my-2 flex h-10 w-full flex-row items-center justify-between rounded-lg px-4'>
              <Text
                className={cn('text-sm font-normal', {
                  'text-text-secondary': isLoading,
                  'text-text-primary': !isLoading,
                })}
              >
                {localization.path[language]}
              </Text>
              <Text
                className={cn('flex items-center text-sm font-normal', {
                  'text-text-secondary': isLoading,
                  'text-text-primary': !isLoading,
                })}
              >
                {selectedPath + '\t\t'}
                <FontAwesomeIcon
                  color={isLoading ? colors.textSecondary : colors.textPrimary}
                  icon={faCaretDown}
                />
              </Text>
            </View>
          </BaseButton>
        )}

        <PathSelectSheet
          isShowing={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          pathOptions={pathOptions[blockchain]}
          selectedPath={selectedPath}
          handleSelectPath={handleSelectPath}
        />

        <View className='bg-card mt-2 flex-1 overflow-hidden rounded-2xl'>
          {error ? (
            <View className='flex flex-col'>
              <WalletItemSkeleton fixed={true} />
              <WalletItemSkeleton fixed={true} />
              <WalletItemSkeleton fixed={true} />
            </View>
          ) : wallets.length === 0 ? (
            <View className='flex h-full flex-col'>
              <WalletItemSkeleton />
              <WalletItemSkeleton />
              <WalletItemSkeleton />
            </View>
          ) : (
            <View className='flex-1'>
              <FlatList
                data={wallets}
                estimatedItemSize={adjust(64)}
                extraData={{ selectedAccounts, walletMap }}
                keyExtractor={(info, index) => `${index}:${info.data.address}`}
                renderItem={renderItem}
                ListFooterComponent={ListEnd}
                onEndReachedThreshold={0.1}
                onEndReached={fetchAddress}
              />
            </View>
          )}
        </View>
      </View>
      <View className='flex w-full flex-col space-y-2'>
        <View className='bg-card flex flex-col rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {(blockchain === IBlockchainType.Tvm
              ? localization.tonV4Message[language]
              : '') + localization.walletLimitMessage[language]}
          </Text>
        </View>
        {error ? (
          <TextButton
            onPress={fetchAddress}
            text={localization.retry[language]}
            disabled={isLoading}
          />
        ) : (
          <TextButton
            onPress={handleContinue}
            text={localization.continue[language]}
            disabled={selectedAccounts.length < 1}
          />
        )}
      </View>
    </ViewWithInset>
  );
}
