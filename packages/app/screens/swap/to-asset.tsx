import { faAngleRight, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { useState } from 'react';
import { Linking, Platform, StyleProp, ViewStyle } from 'react-native';
import { formatCrypto, formatMoney } from '../../common/format/number';
import { Loadable, RecipientAccount } from '../../common/types';
import {
  makeLoadable,
  makeLoadableError,
  mapLoadable,
  onLoadable,
} from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheet } from '../../components/sheet';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { RawTextInput } from '../../components/text-input';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import { SwapRoute } from '../../features/swap/types';
import { getCommonOwnedTokens } from '../../features/swap/utils';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IInteractedAddress,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { ScanAddressQRCode } from '../../molecules/scan/address';
import { SpotForm } from '../quick-trade/types';
import { ChainSection, ChainSelectSheet } from './chain';
import { SwapAssetSelectSheet } from './from-asset';
import { RecipientSection, RecipientSheet } from './recipient';
import { swapAssetPositions } from './utils';

export const ToSection = styled(function (props: {
  formik: SpotForm;
  wallet: IWallet;
  amount: Loadable<string>;
  swappable: Loadable<ICryptoBalance[]>;
  computeToAmount: boolean;
  contacts: Loadable<IContact[]>;
  interactions: Loadable<IInteractedAddress[]>;
  wallets: IWallet[];
  route: Loadable<SwapRoute | null>;
  onToggleLock?: (enabled: boolean) => void;
  onChangeLocalAmount: (amount: string) => void;
  onChangePercentage: (percentage: number) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    formik,
    wallet,
    amount,
    swappable,
    computeToAmount,
    contacts,
    interactions,
    wallets,
    route,
    onToggleLock,
    onChangeLocalAmount,
    onChangePercentage,
    onAddContact,
    style,
  } = props;

  const [showToAssetSheet, setShowToAssetSheet] = useState(false);
  const [showRecipientSheet, setShowRecipientSheet] = useState(false);
  const [showScanSheet, setShowScanSheet] = useState(false);
  const [showChainSheet, setShowChainSheet] = useState(false);

  const input = formik.values;
  const {
    toChainId: chainId,
    toAsset: asset,
    toAccount: recipient,
    amount: fromAmount,
    fromAsset,
  } = input;

  const handleCloseToSheet = () => {
    setShowToAssetSheet(false);
  };

  const handleCloseRecipientSheet = () => {
    setShowRecipientSheet(false);
  };

  const handleCloseScanSheet = () => {
    setShowScanSheet(false);
    onToggleLock?.(true);
  };

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  const handleAssetChange = (asset: ICryptoBalance) => {
    const isSameAsset =
      asset.chainId === input.fromAsset?.chainId &&
      asset.address === input.fromAsset?.address;
    if (isSameAsset) {
      formik.setValues(swapAssetPositions(input));
      onChangeLocalAmount('');
      onChangePercentage(0);
    } else {
      formik.setValues({
        ...input,
        toAsset: asset,
      });
    }
  };

  const handleRecipientChange = (recipient: RecipientAccount) => {
    formik.setValues({
      ...input,
      toAccount: recipient,
    });
  };

  const handleChainChange = (toChainId: number) => {
    const toAsset = input.toAsset;
    const toAccount = input.toAccount;
    const blockchain =
      toChainId === ChainId.Solana ? IBlockchainType.Svm : IBlockchainType.Evm;
    const isWrongSafeChain =
      toAccount?.wallet &&
      toAccount.wallet.type === IWalletType.Safe &&
      toAccount.wallet.chainId !== toChainId;
    const isWrongBlockchain =
      toAccount?.wallet && toAccount.wallet.blockchain !== blockchain;

    const tokens = getCommonOwnedTokens(toChainId, [], true);
    const newToAsset =
      toAsset?.chainId !== toChainId
        ? tokens.find(
            (token) =>
              token.address !== input.fromAsset?.address ||
              token.chainId !== input.fromAsset.chainId,
          )
        : toAsset;
    const validExternal = wallets.filter(
      (wallet) =>
        wallet.blockchain === blockchain && wallet.type !== IWalletType.Safe,
    );
    const validSafe = wallets.filter(
      (wallet) =>
        wallet.blockchain === blockchain && wallet.type === IWalletType.Safe,
    );
    const validCurrent =
      blockchain === wallet.blockchain &&
      (wallet.chainId === 0 || wallet.chainId === toChainId)
        ? wallet
        : undefined;
    const validWallet = validCurrent || validExternal[0] || validSafe[0];
    const newToAccount =
      !isWrongBlockchain && !isWrongSafeChain
        ? toAccount
        : validWallet
        ? {
            address: validWallet.address,
            name: validWallet.name,
            wallet: validWallet,
          }
        : undefined;

    formik.setValues({
      ...input,
      toAsset: newToAsset,
      toAccount: newToAccount,
      toChainId,
    });
  };

  const toBlockchain =
    chainId === ChainId.Solana ? IBlockchainType.Svm : IBlockchainType.Evm;

  return (
    <View className='flex flex-col' style={style}>
      <View className='mb-2 flex flex-row items-center space-x-2'>
        <RecipientSection
          className='flex-1'
          recipient={recipient}
          onRecipientPress={() => setShowRecipientSheet(true)}
        />
        <ChainSection
          chainId={chainId}
          onPress={() => setShowChainSheet(true)}
        />
      </View>
      {asset ? (
        <SelectedToAsset
          asset={asset}
          fromAmount={fromAmount}
          amount={amount}
          swappable={swappable}
          computeToAmount={computeToAmount}
          route={route}
          onPress={() => setShowToAssetSheet(true)}
        />
      ) : (
        <SelectedToEmpty
          fromAsset={fromAsset}
          swappable={swappable}
          onPress={() => setShowToAssetSheet(true)}
        />
      )}
      <SwapAssetSelectSheet
        isShowing={showToAssetSheet}
        blockchain={toBlockchain}
        chainId={toBlockchain === IBlockchainType.Evm ? chainId : undefined}
        asset={asset}
        tokens={swappable}
        onClose={handleCloseToSheet}
        onAssetChange={handleAssetChange}
      />
      <RecipientSheet
        isShowing={showRecipientSheet}
        blockchain={toBlockchain}
        chainId={chainId}
        wallets={wallets}
        contacts={contacts.data ?? []}
        interactions={interactions.data ?? []}
        onClose={handleCloseRecipientSheet}
        onRecipientChange={handleRecipientChange}
        onScanQRCode={
          Platform.OS !== 'web'
            ? () => {
                onToggleLock?.(false);
                setShowScanSheet(true);
              }
            : undefined
        }
        onAddContact={onAddContact}
      />
      <ChainSelectSheet
        isShowing={showChainSheet}
        onChainChange={handleChainChange}
        onClose={() => setShowChainSheet(false)}
      />
      {Platform.OS !== 'web' && (
        <ActionSheet
          isShowing={showScanSheet}
          onClose={handleCloseScanSheet}
          isFullHeight={true}
          hasBottomInset={false}
          hasTopInset={Platform.OS === 'android'}
        >
          <ScanAddressQRCode
            address={wallet.address}
            blockchain={toBlockchain}
            onBack={handleCloseScanSheet}
            onRequestCamera={handleRequestCamera}
            onScanAddress={async (address) => {
              handleRecipientChange({ address });
              setShowRecipientSheet(false);
              handleCloseScanSheet();
            }}
          />
        </ActionSheet>
      )}
    </View>
  );
});

const SelectedToAsset = styled(function (props: {
  asset: ICryptoBalance;
  fromAmount: string;
  amount: Loadable<string>;
  swappable: Loadable<ICryptoBalance[]>;
  computeToAmount: boolean;
  route: Loadable<SwapRoute | null>;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    asset,
    fromAmount,
    amount,
    swappable,
    computeToAmount,
    route,
    onPress,
    style,
  } = props;
  const value = mapLoadable(route)((route) => {
    if (route) {
      const price = parseFloat(route.data.toAmountUSD);
      return formatMoney(price);
    } else {
      return formatMoney(0);
    }
  });
  const normalizedAmount =
    fromAmount === '' || fromAmount === '.'
      ? makeLoadable('')
      : parseFloat(fromAmount) === 0
      ? makeLoadable('0')
      : amount;

  return (
    <View style={style}>
      <View className='bg-card h-24 space-y-3 rounded-2xl px-4 py-4'>
        <View className='flex flex-row items-center space-x-4'>
          <CryptoAvatar
            size={32}
            url={asset.tokenMetadata.imageUrl}
            symbol={asset.tokenMetadata.symbol}
            chainId={asset.chainId}
          />
          {onLoadable(computeToAmount ? normalizedAmount : makeLoadableError())(
            () => (
              <Skeleton
                height={36}
                width={96}
                borderRadius={8}
                className='w-full flex-1'
              />
            ),
            () => (
              <RawTextInput
                className='text-text-placeholder w-full flex-1 bg-transparent text-2xl outline-none'
                id={'swap_to_amount_error'}
                value={'-'}
                editable={false}
              />
            ),
            (amount) => (
              <RawTextInput
                className='w-full flex-1 bg-transparent text-2xl outline-none'
                style={{
                  color:
                    amount === '' ? colors.textPlaceholder : colors.textPrimary,
                }}
                id={'swap_to_amount'}
                placeholder={'-'}
                placeholderTextColor={colors.textPlaceholder}
                value={amount === '' ? '-' : amount}
                editable={false}
                autoComplete='off'
              />
            ),
          )}
          <View className='max-w-[75%]'>
            <BaseButton
              className='bg-card-highlight overflow-hidden rounded-full'
              onPress={onPress}
              disabled={!swappable.success}
            >
              {onLoadable(swappable)(
                () => (
                  <View className='flex flex-row items-center justify-center space-x-1 py-1 pl-3 pr-2'>
                    <Text className='text-text-secondary truncate text-sm font-bold'>
                      {'Loading...'}
                    </Text>
                  </View>
                ),
                () => (
                  <View className='flex flex-row items-center justify-center space-x-1 py-1 pl-3 pr-2'>
                    <Text className='text-text-secondary truncate text-sm font-bold'>
                      {'Error Fetching Routes'}
                    </Text>
                  </View>
                ),
                () => (
                  <View className='flex flex-row items-center justify-center space-x-1 py-1 pl-3 pr-2'>
                    <Text className='text-text-secondary truncate text-sm font-medium'>
                      {asset.tokenMetadata.symbol}
                    </Text>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={adjust(10, 2)}
                      color={colors.textSecondary}
                    />
                  </View>
                ),
              )}
            </BaseButton>
          </View>
        </View>

        <View className='flex flex-row justify-between'>
          <Text className='text-text-secondary text-sm font-medium'>
            {value.data}
          </Text>
          <View className='flex flex-row items-center space-x-1'>
            <Text className='text-text-secondary text-sm font-medium'>
              Balance:{' '}
              {formatCrypto(asset.balance, asset.tokenMetadata.decimals)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const SelectedToEmpty = styled(function (props: {
  fromAsset?: ICryptoBalance;
  swappable: Loadable<ICryptoBalance[]>;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { fromAsset, swappable, onPress, style } = props;

  return (
    <View style={style}>
      <BaseButton
        className='overflow-hidden'
        onPress={onPress}
        disabled={!fromAsset || !swappable.success}
      >
        <View className='bg-card flex h-24 flex-row items-center justify-between rounded-2xl p-4'>
          <View className='flex flex-row items-center space-x-4'>
            <View className='bg-card-highlight h-8 w-8 rounded-full' />
            <Text className=' text-text-secondary text-xl font-bold'>
              {fromAsset ? 'Select Asset' : '-'}
            </Text>
          </View>
          {fromAsset && swappable.success ? (
            <View className='pr-2 text-base font-bold'>
              <FontAwesomeIcon
                className='text-text-secondary'
                icon={faAngleRight}
                size={16}
              />
            </View>
          ) : (
            <View />
          )}
        </View>
      </BaseButton>
    </View>
  );
});
