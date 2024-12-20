import { faAnglesDown } from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleExclamation,
  faScaleUnbalanced,
} from '@fortawesome/pro-solid-svg-icons';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { formatMoney } from '../../common/format/number';
import { useEffectOnSuccess } from '../../common/hooks/loading';
import { Tuple } from '../../common/types';
import { tuple } from '../../common/utils/functions';
import {
  makeLoadable,
  mapLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { Banner } from '../../components/banner';
import { CardEmptyState } from '../../components/card/card-empty-state';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { InlineErrorTooltip } from '../../components/input-error';
import { PercentageSlider } from '../../components/slider/percentage';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import {
  trimDecimals,
  validDecimalAmount,
} from '../../features/crypto/transfer';
import { cryptoKey } from '../../features/crypto/utils';
import { useTokenPricesQuery } from '../../features/swap';
import { PresetInput, SwapPresets } from '../../features/swap/types';
import { getCommonOwnedTokens } from '../../features/swap/utils';
import {
  IBlockchainType,
  ICryptoBalance,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { AssetInput, PriceInput, TokenAssetSheet } from './input';
import { PresetAmountSheet } from './preset/sheet';
import { SettingsButton } from './settings';
import { ToAsset } from './to';
import { LimitForm, QuickTradeMode, SpotForm } from './types';
import {
  getLimitOrderInputError,
  getPresetsForAsset,
  selectSecondaryAsset,
  useLocalForm,
} from './utils';

export function LimitPanel(props: {
  wallet: IWallet;
  spotForm: SpotForm;
  limitForm: LimitForm;
  presets: SwapPresets;
  crypto: ICryptoBalance[];
  mode: QuickTradeMode;
  externalError?: string;
  onPresetsChange: (input: PresetInput) => Promise<void>;
  onSecondaryAssetChange: (asset: ICryptoBalance) => void;
  onSettingsPress: VoidFunction;
  onExpand: VoidFunction;
}) {
  const {
    wallet,
    spotForm,
    limitForm,
    presets: savedPresets,
    crypto,
    mode,
    externalError,
    onPresetsChange,
    onSecondaryAssetChange,
    onSettingsPress,
    onExpand,
  } = props;
  const { fromAsset, toAsset, amount } = limitForm.values;
  const {
    localAmount,
    percentage,
    touched,
    propogatePercentage,
    propogateAmount,
  } = useLocalForm(limitForm, mode);

  const [showSecondaryAssetSheet, setShowSecondaryAssetSheet] = useState(false);
  const [showPresetsSheet, setShowPresetsSheet] = useState(false);
  const [localPrice, setLocalPrice] = useState('');
  const [marketCapPercentage, setMarketCapPercentage] = useState('');
  const [priceEntryType, setPriceEntryType] = useState<'amount' | 'percent'>(
    'amount',
  );

  const { data: commonTokenPrices, refetch: refetchCommon } =
    useTokenPricesQuery(
      getCommonOwnedTokens(limitForm.values.chainId, [], true).map(
        (token) => token.address,
      ),
      limitForm.values.chainId,
      {
        enabled: limitForm.values.chainId === ChainId.Solana,
        staleTime: 30 * 1000,
      },
    );

  const { data: tokenPrices, refetch } = useTokenPricesQuery(
    [limitForm.values.fromAsset?.address!, limitForm.values.toAsset?.address!],
    limitForm.values.chainId,
    {
      enabled:
        limitForm.values.chainId === ChainId.Solana &&
        !!limitForm.values.fromAsset &&
        !!limitForm.values.toAsset,
      staleTime: 5 * 1000,
    },
  );

  const sliderColor = mode === 'buy' ? colors.success : colors.failure;
  const primaryAsset = mode === 'buy' ? toAsset : fromAsset;
  const secondaryAsset = mode === 'sell' ? toAsset : fromAsset;

  const handleSelectSecondaryAsset = (asset: ICryptoBalance) => {
    selectSecondaryAsset(asset, mode, spotForm, limitForm);
    onSecondaryAssetChange(asset);
  };

  const handleChangeAmountDelayed = useCallback(
    (amount: string) => {
      propogateAmount(amount, 'delay');
    },
    [fromAsset],
  );

  const handleSliderStart = () => {
    spotForm.setFieldValue('disabled', true);
  };

  const handleSliderChange = (value: number) => {
    if (percentage !== value) {
      propogatePercentage(value, 'none');
    }
  };

  const handleSliderRelease = (value: number) => {
    propogatePercentage(value, 'instant');
  };

  const propogatePrice = (
    value: string,
    marketPrice: string,
    type: 'instant' | 'delay' | 'none',
  ) => {
    if (type === 'delay') {
      limitForm.setFieldValue('disabled', true);
      debouncePrice(value, marketPrice);
    } else if (type === 'instant') {
      limitForm.setFieldValue('disabled', false);
      limitForm.setFieldValue('targetPrice', value);
      limitForm.setFieldValue('marketPrice', marketPrice);
    }
  };

  const handlePercentagePresetsChange = async (presets: Tuple<string, 3>) => {
    if (!fromAsset || !savedPresets) return;
    await onPresetsChange({
      address: fromAsset.address,
      chainId: fromAsset.chainId,
      percentagePresets: presets.map((value) => parseInt(value)) as Tuple<
        number,
        3
      >,
    });
  };

  const handleAbsolutePresetsChange = async (presets: Tuple<string, 3>) => {
    if (!fromAsset || !savedPresets) return;
    await onPresetsChange({
      address: fromAsset.address,
      chainId: fromAsset.chainId,
      presets,
    });
  };

  const handlePriceChange = useCallback(
    (price: string, propogate: 'instant' | 'delay' | 'none') => {
      if (
        !fromAsset ||
        !toAsset ||
        !tokenPrices.success ||
        !tokenPrices.data[toAsset.address] ||
        !tokenPrices.data[fromAsset.address]
      ) {
        return;
      } else {
        const primaryPrice =
          tokenPrices.data[
            mode === 'buy' ? toAsset.address : fromAsset.address
          ]!.price;
        const mcPercent = validDecimalAmount(
          ((parseFloat(price || '0') * 100) / primaryPrice).toString(),
          2,
        );
        setLocalPrice(price);
        setMarketCapPercentage(mcPercent);
        propogatePrice(price, primaryPrice.toString(), propogate);
      }
    },
    [fromAsset, toAsset, amount, mode, ...spreadLoadable(tokenPrices)],
  );

  const handlePricePercentageChange = useCallback(
    (percentage: string, propogate: 'instant' | 'delay' | 'none') => {
      if (
        !fromAsset ||
        !toAsset ||
        !tokenPrices.success ||
        !tokenPrices.data[toAsset.address] ||
        !tokenPrices.data[fromAsset.address]
      ) {
        return;
      } else {
        const price =
          (parseFloat(percentage || '0') / 100) *
          tokenPrices.data[
            mode === 'buy' ? toAsset.address : fromAsset.address
          ]!.price;
        handlePriceChange(price.toString(), propogate);
        setMarketCapPercentage(percentage);
      }
    },
    [fromAsset, toAsset, mode, ...spreadLoadable(tokenPrices)],
  );

  const handlePriceChangeDelayed = useCallback(
    (price: string) => {
      handlePriceChange(price, 'delay');
    },
    [handlePriceChange],
  );

  const handlePricePercentageChangeDelayed = useCallback(
    (percentage: string) => {
      handlePricePercentageChange(percentage, 'delay');
    },
    [handlePricePercentageChange],
  );

  const handlePriceEntryTypeChange = (type: 'amount' | 'percent') => {
    setPriceEntryType(type);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchCommon(), refetch()]);
  };

  const formattedValue = (amount: string, priceStr?: string) => {
    if (!priceStr) return '-';
    const price = parseFloat(priceStr);
    const value = parseFloat(amount);
    return formatMoney(!isNaN(value) ? value * price : 0);
  };

  const computeToAmount = () => {
    const localPriceFloat = parseFloat(localPrice);
    const localAmountFloat = parseFloat(localAmount || '0');
    if (!fromAsset || !toAsset || !commonTokenPrices.success) {
      return tuple('', '');
    } else if (
      isNaN(localPriceFloat) ||
      localPriceFloat === 0 ||
      isNaN(localAmountFloat) ||
      localAmountFloat === 0
    ) {
      return tuple('', '');
    } else if (mode === 'buy') {
      const totalPrice =
        localAmountFloat * parseFloat(fromAsset.tokenMetadata.price);
      return tuple(
        ethers
          .parseUnits(
            trimDecimals(
              totalPrice / localPriceFloat,
              toAsset.tokenMetadata.decimals,
            ),
            toAsset.tokenMetadata.decimals,
          )
          .toString(),
        totalPrice.toString(),
      );
    } else {
      const totalPrice = localPriceFloat * localAmountFloat;
      const toPrice = commonTokenPrices.data[toAsset.address]!.price;
      return tuple(
        ethers
          .parseUnits(
            trimDecimals(totalPrice / toPrice, toAsset.tokenMetadata.decimals),
            toAsset.tokenMetadata.decimals,
          )
          .toString(),
        totalPrice.toString(),
      );
    }
  };

  const commonOwnedTokens = useMemo(
    () => makeLoadable(getCommonOwnedTokens(limitForm.values.chainId, crypto)),
    [crypto, limitForm.values.chainId],
  );

  const { absolute: absolutePresets, percentage: percentagePresets } =
    getPresetsForAsset(fromAsset, savedPresets);

  const debouncePrice = useDebounceCallback(
    useCallback((localPrice: string, marketPrice: string) => {
      limitForm.setFieldValue('disabled', false);
      limitForm.setFieldValue('targetPrice', localPrice);
      limitForm.setFieldValue('marketPrice', marketPrice);
    }, []),
    400,
  );

  const error =
    getLimitOrderInputError({
      ...limitForm.values,
      amount: localAmount,
    }) || externalError;

  const showError = touched;
  const primaryPrice = mapLoadable(tokenPrices)((prices) => {
    if (mode === 'buy' && limitForm.values.toAsset) {
      const price = prices[limitForm.values.toAsset.address]?.price ?? 0;
      return price ? price.toString() : null;
    } else if (mode === 'sell' && limitForm.values.fromAsset) {
      const price = prices[limitForm.values.fromAsset.address]?.price ?? 0;
      return price ? price.toString() : null;
    } else {
      return null;
    }
  });
  const fromValue = formattedValue(
    localAmount,
    mode === 'buy' ? fromAsset?.tokenMetadata.price : localPrice,
  );
  const [toAmount, totalPrice] = computeToAmount();
  const valid = tokenPrices.success && commonTokenPrices.success;
  const missingPrice = primaryPrice.success && !primaryPrice.data;

  useEffectOnSuccess(primaryPrice, (price) => {
    handlePriceChange(price ? price.toString() : '', 'instant');
  });

  useEffect(() => {
    setLocalPrice('');
  }, [cryptoKey(primaryAsset)]);

  return wallet.blockchain === IBlockchainType.Svm ? (
    <View className='flex flex-col'>
      <View className='flex flex-col space-y-2'>
        {(tokenPrices.error || commonTokenPrices.error || missingPrice) && (
          <Banner
            title='Limit order not available'
            subtitle='Limit Order Not Available'
            body={`We couldn't find the market price for this token. Try refreshing or selecting another token to place a limit order.`}
            color={colors.failure}
            icon={faCircleExclamation}
          />
        )}
        {primaryAsset && (
          <PriceInput
            marketPrice={primaryPrice}
            mode={mode}
            entryType={priceEntryType}
            price={localPrice}
            percentage={marketCapPercentage}
            editable={valid && !missingPrice}
            onPriceChange={handlePriceChangeDelayed}
            onRefresh={handleRefresh}
            onPercentageChange={handlePricePercentageChangeDelayed}
            onEntryTypeChange={handlePriceEntryTypeChange}
            onExpand={onExpand}
          />
        )}
        <AssetInput
          hasPrimary={!!primaryAsset}
          asset={mode === 'buy' ? secondaryAsset : primaryAsset}
          amount={localAmount}
          value={fromValue}
          editable={!!primaryAsset && valid}
          mode={mode}
          onPress={() => setShowSecondaryAssetSheet(true)}
          onChangeAmount={handleChangeAmountDelayed}
          onExpand={onExpand}
          adornment={<SettingsButton onPress={onSettingsPress} />}
        />
        {showError && !!error && (
          <View className='flex w-full flex-row items-center'>
            <InlineErrorTooltip errorText={error} isEnabled={true} />
          </View>
        )}
        <PercentageSlider
          className='flex w-full flex-row items-center'
          percentage={percentage}
          sliderColor={sliderColor}
          onPercentageChange={handleSliderChange}
          onStart={handleSliderStart}
          onRelease={handleSliderRelease}
        />
        {(toAmount !== '' || mode === 'sell') && (
          <View className='flex flex-row items-center space-x-2 pt-2'>
            <View className='bg-card-highlight h-[1px] flex-1' />
            <FontAwesomeIcon
              icon={faAnglesDown}
              color={colors.cardHighlight}
              size={adjust(14, 2)}
            />
            <View className='bg-card-highlight h-[1px] flex-1' />
          </View>
        )}
      </View>
      <ToAsset
        mode={mode}
        asset={limitForm.values.toAsset}
        amount={makeLoadable(toAmount)}
        value={makeLoadable(totalPrice)}
        route={makeLoadable(null)}
        onSelectAsset={() => setShowSecondaryAssetSheet(true)}
      />
      <TokenAssetSheet
        blockchain={wallet.blockchain}
        tokens={commonOwnedTokens}
        isShowing={showSecondaryAssetSheet}
        searchDisabled={true}
        onSelectAsset={handleSelectSecondaryAsset}
        onClose={() => setShowSecondaryAssetSheet(false)}
      />
      {fromAsset && (
        <PresetAmountSheet
          isShowing={showPresetsSheet}
          decimals={fromAsset.tokenMetadata.decimals}
          presets={mode === 'buy' ? absolutePresets : percentagePresets}
          onPresetsChange={
            mode === 'buy'
              ? handleAbsolutePresetsChange
              : handlePercentagePresetsChange
          }
          onClose={() => setShowPresetsSheet(false)}
        />
      )}
    </View>
  ) : (
    <View className='mt-16 h-full flex-1'>
      <CardEmptyState
        title='Network not Supported'
        description='Limit orders are currently not available on this network.'
        overrideIcon={
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faScaleUnbalanced}
              color={colors.primary}
              size={48}
            />
          </View>
        }
      />
    </View>
  );
}
