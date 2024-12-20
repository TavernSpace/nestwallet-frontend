import { faAnglesDown } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useMemo, useState } from 'react';
import { formatMoney } from '../../common/format/number';
import { Loadable, Tuple } from '../../common/types';
import { makeLoadable, mapLoadable } from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { InlineErrorTooltip } from '../../components/input-error';
import { PercentageSlider } from '../../components/slider/percentage';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import { PresetInput, SwapPresets, SwapRoute } from '../../features/swap/types';
import {
  getCommonOwnedTokens,
  getSwapAssetError,
  isInputValid,
} from '../../features/swap/utils';
import {
  ICryptoBalance,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { useAudioContext } from '../../provider/audio';
import { AssetInput, TokenAssetSheet } from './input';
import { PresetButtons } from './preset/button';
import { PresetAmountSheet } from './preset/sheet';
import { SettingsButton } from './settings';
import { SettingsSummary } from './settings/summary';
import { ToAsset } from './to';
import { LimitForm, QuickTradeMode, SpotForm } from './types';
import {
  getPresetsForAsset,
  selectSecondaryAsset,
  useLocalForm,
} from './utils';

export function SpotPanel(props: {
  wallet: IWallet;
  limitForm: LimitForm;
  spotForm: SpotForm;
  route: Loadable<SwapRoute | null>;
  presets: SwapPresets;
  toAmount: Loadable<string>;
  crypto: ICryptoBalance[];
  mode: QuickTradeMode;
  mev: boolean;
  tip?: bigint;
  totalFee: Loadable<bigint>;
  externalError?: string;
  onPresetsChange: (input: PresetInput) => Promise<void>;
  onSecondaryAssetChange: (asset: ICryptoBalance) => void;
  onSettingsPress: VoidFunction;
  onExpand: VoidFunction;
}) {
  const {
    wallet,
    limitForm,
    spotForm,
    route,
    presets: savedPresets,
    crypto,
    mode,
    mev,
    tip,
    totalFee,
    externalError,
    onPresetsChange,
    onSecondaryAssetChange,
    onSettingsPress,
    onExpand,
  } = props;
  const { fromAsset, toAsset } = spotForm.values;
  const { pressSound } = useAudioContext().sounds;
  const {
    localAmount,
    percentage,
    touched,
    propogatePercentage,
    propogateAmount,
  } = useLocalForm(spotForm, mode);

  const [showSecondaryAssetSheet, setShowSecondaryAssetSheet] = useState(false);
  const [showPresetsSheet, setShowPresetsSheet] = useState(false);

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

  const handleChangeAmountInstant = useCallback(
    (amount: string) => {
      propogateAmount(amount, 'instant');
    },
    [fromAsset, localAmount],
  );

  const handlePercentagePresetChange = useCallback(
    (amount: string) => {
      propogatePercentage(parseInt(amount.slice(0, -1)), 'instant');
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

  const formattedValue = (amount: string, asset?: ICryptoBalance) => {
    const price = asset?.tokenMetadata.price
      ? parseFloat(asset.tokenMetadata.price)
      : 0;
    const value = parseFloat(amount);
    return formatMoney(!isNaN(value) ? (asset ? value * price : 0) : 0);
  };

  const commonOwnedTokens = useMemo(
    () =>
      makeLoadable(getCommonOwnedTokens(spotForm.values.fromChainId, crypto)),
    [crypto, spotForm.values.fromChainId],
  );

  const { absolute: absolutePresets, percentage: percentagePresets } =
    getPresetsForAsset(fromAsset, savedPresets);

  const fromValue = formattedValue(localAmount, fromAsset);
  const error =
    getSwapAssetError({ ...spotForm.values, amount: localAmount }, route) ||
    externalError;
  const showError = touched || error === 'No route found';
  const validInput = isInputValid(spotForm.values);

  return (
    <View className='flex flex-col'>
      <View className='flex flex-col space-y-2'>
        <AssetInput
          hasPrimary={!!primaryAsset}
          asset={mode === 'buy' ? secondaryAsset : primaryAsset}
          amount={localAmount}
          value={fromValue}
          editable={!!primaryAsset}
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
        <PresetButtons
          sound={pressSound}
          disabled={!fromAsset}
          presets={mode === 'sell' ? percentagePresets : absolutePresets}
          onAmountChange={
            mode === 'sell'
              ? handlePercentagePresetChange
              : handleChangeAmountInstant
          }
          onModifyPresets={() => setShowPresetsSheet(true)}
        />
        <PercentageSlider
          className='flex w-full flex-row items-center'
          percentage={percentage}
          sliderColor={sliderColor}
          onPercentageChange={handleSliderChange}
          onStart={handleSliderStart}
          onRelease={handleSliderRelease}
        />
        <View className='pt-1'>
          <SettingsSummary
            chainId={spotForm.values.fromChainId}
            tip={tip}
            mev={
              mev &&
              (spotForm.values.fromChainId === ChainId.Solana ||
                spotForm.values.fromChainId === ChainId.Ethereum)
            }
            slippage={spotForm.values.slippage}
            totalGas={totalFee}
          />
        </View>
        {((validInput && !error) || mode === 'sell') && (
          <View className='flex flex-row items-center space-x-2'>
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
        asset={spotForm.values.toAsset}
        route={route}
        amount={
          !validInput || !!error
            ? makeLoadable('')
            : mapLoadable(route)((route) => route?.data?.toAmount ?? '')
        }
        value={
          !validInput || !!error
            ? makeLoadable('')
            : mapLoadable(route)((route) => route?.data?.toAmountUSD ?? '')
        }
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
  );
}
