import { faAngleRight, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { clamp } from 'lodash';
import { styled } from 'nativewind';
import { useCallback, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';
import { formatCrypto, formatMoney } from '../../common/format/number';
import { Loadable } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { PercentageSlider } from '../../components/slider/percentage';
import { Text } from '../../components/text';
import { RawTextInput } from '../../components/text-input';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import {
  getMaxBalanceMinusGas,
  validDecimalAmount,
} from '../../features/crypto/transfer';
import {
  IBlockchainType,
  ICryptoBalance,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { AssetSelect } from '../../molecules/select/asset-select';
import { SpotForm } from '../quick-trade/types';
import { swapAssetPositions } from './utils';

export const FromSection = styled(function (props: {
  formik: SpotForm;
  wallet: IWallet;
  cryptoBalances: Loadable<ICryptoBalance[]>;
  amount: string;
  percentage: number;
  onChangeAmount: (amount: string) => void;
  onChangeLocalAmount: (amount: string) => void;
  onChangePercentage: (percentage: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    formik,
    wallet,
    cryptoBalances,
    amount,
    percentage,
    onChangeAmount,
    onChangeLocalAmount,
    onChangePercentage,
    style,
  } = props;

  const [showAssetSheet, setShowAssetSheet] = useState(false);

  const input = formik.values;

  const handlePress = () => {
    setShowAssetSheet(true);
  };

  const handleClose = () => {
    setShowAssetSheet(false);
  };

  const handleSelectAsset = (asset: ICryptoBalance) => {
    const toChainId = input.toChainId;
    const toAsset = input.toAsset;
    const isSameAsToAsset =
      asset.chainId === input.toAsset?.chainId &&
      asset.address === input.toAsset?.address;
    if (
      asset.address === input.fromAsset?.address &&
      asset.chainId === input.fromAsset.chainId
    ) {
      return;
    } else if (isSameAsToAsset) {
      onChangeLocalAmount('');
      onChangePercentage(0);
      formik.setValues(swapAssetPositions(input));
    } else {
      onChangeLocalAmount('');
      onChangePercentage(0);
      formik.setValues({
        ...input,
        amount: '',
        fromChainId: asset.chainId,
        toChainId,
        fromAsset: asset,
        toAsset,
      });
    }
  };

  return (
    <View style={style}>
      {input.fromAsset ? (
        <SelectedFromAsset
          asset={input.fromAsset}
          amount={amount}
          percentage={percentage}
          onChangeAmount={onChangeAmount}
          onChangeLocalAmount={onChangeLocalAmount}
          onChangePercentage={onChangePercentage}
          onPress={handlePress}
        />
      ) : (
        <SelectedFromEmpty onPress={handlePress} />
      )}
      <SwapAssetSelectSheet
        isShowing={showAssetSheet}
        blockchain={wallet.blockchain}
        asset={input.fromAsset}
        tokens={cryptoBalances}
        onClose={handleClose}
        onAssetChange={handleSelectAsset}
      />
    </View>
  );
});

const SelectedFromEmpty = styled(function (props: {
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { onPress, style } = props;

  return (
    <View style={style}>
      <BaseButton className='overflow-hidden' onPress={onPress}>
        <View className='bg-card flex h-24 flex-row items-center justify-between rounded-2xl p-4'>
          <View className='flex flex-row items-center space-x-4'>
            <View className='bg-card-highlight h-8 w-8 rounded-full' />
            <Text className=' text-text-secondary text-xl font-bold'>
              Select Asset
            </Text>
          </View>
          <View className='pr-2 text-base font-bold'>
            <FontAwesomeIcon
              className='text-text-secondary'
              icon={faAngleRight}
              size={16}
            />
          </View>
        </View>
      </BaseButton>
    </View>
  );
});

const SelectedFromAsset = styled(function (props: {
  asset: ICryptoBalance;
  amount: string;
  percentage: number;
  onPress: VoidFunction;
  onChangeAmount: (amount: string) => void;
  onChangeLocalAmount: (amount: string) => void;
  onChangePercentage: (percentage: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    asset,
    amount,
    percentage,
    onPress,
    onChangeAmount,
    onChangeLocalAmount,
    onChangePercentage,
    style,
  } = props;

  const price = parseFloat(asset.tokenMetadata.price);
  const value = parseFloat(amount);
  const formattedValue = value > 0 ? formatMoney(value * price) : '';

  const handlePercentage = (amount: string) => {
    const total = parseFloat(getMaxBalanceMinusGas(asset, 'swap'));
    const normalizedAmount = amount || '0';
    const percentage =
      total === 0
        ? 100
        : clamp(
            Math.round((parseFloat(normalizedAmount) / total) * 100),
            0,
            100,
          );
    onChangePercentage(percentage);
  };

  const handleChangeAmount = (value: string) => {
    const validAmount = validDecimalAmount(value, asset.tokenMetadata.decimals);
    handlePercentage(validAmount);
    onChangeLocalAmount(validAmount);
    propogateValue(validAmount, 'delay');
  };

  const handleMax = () => {
    const validAmount = getMaxBalanceMinusGas(asset, 'swap');
    handlePercentage(validAmount);
    onChangeLocalAmount(validAmount);
    propogateValue(validAmount, 'instant');
  };

  const propogateValue = (
    value: string,
    type: 'instant' | 'delay' | 'none',
  ) => {
    if (type === 'delay') {
      debounced(value);
    } else if (type === 'instant') {
      onChangeAmount(value);
    }
  };

  const handlePercentageChange = (
    value: number,
    propogate: 'instant' | 'delay' | 'none',
  ) => {
    onChangePercentage(value);
    const amountBig = getMaxBalanceMinusGas(asset, 'swap');
    if (value === 100) {
      const amount = validDecimalAmount(
        amountBig,
        asset.tokenMetadata.decimals,
      );
      onChangeLocalAmount(amount);
      propogateValue(amount, propogate);
    } else {
      const amount = validDecimalAmount(
        `${parseFloat(amountBig) * (value / 100)}`,
        asset.tokenMetadata.decimals,
      );
      onChangeLocalAmount(amount);
      propogateValue(amount, propogate);
    }
  };

  const handleSliderChange = useCallback(
    (value: number) => {
      if (percentage !== value) {
        handlePercentageChange(value, 'none');
      }
    },
    [asset, percentage],
  );

  const handleSliderRelease = useCallback(
    (value: number) => {
      handlePercentageChange(value, 'instant');
    },
    [asset],
  );

  const debounced = useDebounceCallback(
    useCallback((amount: string) => {
      onChangeAmount(amount);
    }, []),
    400,
  );

  return (
    <View className='flex flex-col' style={style}>
      <View className='bg-card h-24 space-y-3 rounded-2xl px-4 py-4'>
        <View className='flex flex-row items-center space-x-4'>
          <CryptoAvatar
            size={32}
            url={asset.tokenMetadata.imageUrl}
            symbol={asset.tokenMetadata.symbol}
            chainId={asset.chainId}
          />
          <RawTextInput
            className='text-text-primary w-full flex-1 bg-transparent text-2xl outline-none'
            id={'swap_from_amount'}
            placeholder={'0'}
            placeholderTextColor={colors.textPlaceholder}
            value={amount}
            autoComplete='off'
            inputMode='decimal'
            onChangeText={handleChangeAmount}
          />
          <View className='max-w-[75%]'>
            <BaseButton
              className='bg-card-highlight overflow-hidden rounded-full'
              onPress={onPress}
            >
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
            </BaseButton>
          </View>
        </View>
        <View className='flex flex-row items-center justify-between'>
          <Text
            className='text-text-secondary flex-1 truncate text-sm font-medium'
            numberOfLines={1}
          >
            {formattedValue}
          </Text>
          <View className='flex flex-1 flex-row items-center justify-end space-x-1'>
            <Text
              className='text-text-secondary truncate text-end text-sm font-medium'
              numberOfLines={1}
            >
              {'Balance: '}
              <Text
                className='text-primary text-sm font-medium'
                onPress={handleMax}
              >
                {formatCrypto(asset.balance, asset.tokenMetadata.decimals)}
              </Text>
            </Text>
          </View>
        </View>
      </View>
      <PercentageSlider
        className='mt-2 flex w-full flex-row items-center'
        percentage={percentage}
        sliderColor={colors.primary}
        opacity={15}
        onPercentageChange={handleSliderChange}
        onRelease={handleSliderRelease}
      />
    </View>
  );
});

export function SwapAssetSelectSheet(props: {
  isShowing: boolean;
  blockchain: IBlockchainType;
  chainId?: number;
  asset?: ICryptoBalance;
  tokens: Loadable<ICryptoBalance[]>;
  onClose: VoidFunction;
  onAssetChange: (asset: ICryptoBalance) => void;
}) {
  const {
    isShowing,
    blockchain,
    chainId,
    asset,
    tokens,
    onAssetChange,
    onClose,
  } = props;

  return (
    <ActionSheet
      isFullHeight={true}
      hasBottomInset={false}
      isShowing={isShowing}
      onClose={onClose}
    >
      <View className='flex h-full flex-col'>
        <ActionSheetHeader
          title='Select Token'
          onClose={onClose}
          type='fullscreen'
        />
        <AssetSelect
          blockchain={blockchain}
          chainIdOverride={chainId}
          cryptos={tokens}
          onChange={(crypto) => {
            onAssetChange(crypto as ICryptoBalance);
            onClose();
          }}
          value={asset}
          hideNFTs={true}
        />
      </View>
    </ActionSheet>
  );
}
