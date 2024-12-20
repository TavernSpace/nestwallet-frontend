import cn from 'classnames';
import { ethers } from 'ethers';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import { Keyboard, Platform, StyleProp, ViewStyle } from 'react-native';
import { formatCryptoFloat, formatMoney } from '../../common/format/number';
import { useEffectOnSuccess } from '../../common/hooks/loading';
import { BasicFeeData, Loadable } from '../../common/types';
import { opacity, tuple } from '../../common/utils/functions';
import {
  composeLoadables,
  makeLoadable,
  makeLoadableLoading,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { BaseButton } from '../../components/button/base-button';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { validDecimalAmount } from '../../features/crypto/transfer';
import { GasPriceLevel } from '../../features/proposal/types';
import { IFeeData, IGasLevel } from '../../graphql/client/generated/graphql';
import { GasSelectSheet } from './sheet';
import { aggregateTotalFees, feeDataToGasLevels, gasLevelMap } from './utils';

interface GasSectionProps {
  chainId: number;
  feeData: Loadable<IFeeData | BasicFeeData>;
  gasLimit: Loadable<bigint>;
  sendAmount: string;
  balance: Loadable<bigint | null>;
  // TODO: we should make the ui show a range and expected price to make this more intuitive
  // What to multiply the gasLimit estimate by to detect whether the user is missing gas
  gasMultiplier?: number;
  defaultGasLevel?: IGasLevel;
  defaultGasPriceLevel?: Loadable<GasPriceLevel>;
  onChange: (level: GasPriceLevel, gasLimit: bigint[]) => void;
  onMissingGas: (missingGas: boolean) => void;
  hasBackground?: boolean;
  backgroundColor?: string;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GasSection = styled(function (props: GasSectionProps) {
  const {
    chainId,
    gasLimit,
    feeData,
    sendAmount,
    balance,
    gasMultiplier = 1,
    defaultGasLevel = IGasLevel.Standard,
    defaultGasPriceLevel,
    onChange,
    onMissingGas,
    hasBackground = false,
    backgroundColor = colors.card,
    editable = true,
    style,
  } = props;

  const [selectedGasLevel, setSelectedGasLevel] = useState<
    Loadable<GasPriceLevel>
  >(defaultGasPriceLevel ?? makeLoadableLoading());
  const [showEditSheet, setShowEditSheet] = useState(false);

  const chainInfo = getChainInfo(chainId);

  const gasLevels = useMemo(
    () => mapLoadable(feeData)((data) => feeDataToGasLevels(data)),
    [...spreadLoadable(feeData)],
  );

  const totalFees = composeLoadables(
    feeData,
    gasLimit,
    selectedGasLevel,
    gasLevels,
  )(aggregateTotalFees);

  const sufficientFunds = composeLoadables(
    totalFees,
    balance,
  )((totalFees, balance) => {
    if (balance === null) return false;
    const txAmount = BigInt(sendAmount);
    if (chainId === ChainId.Solana) {
      const solFee = ethers.formatUnits(totalFees.totalFeeBig, 15);
      const validated = validDecimalAmount(solFee, 9);
      const mult =
        ethers.parseUnits(validated, 9) * BigInt(Math.ceil(gasMultiplier * 10));
      return mult / 10n + txAmount <= balance;
    } else {
      return (
        totalFees.totalFeeBig * BigInt(gasMultiplier) + txAmount <= balance
      );
    }
  });

  const gasLevelAndLimits = useMemo(
    () => composeLoadables(selectedGasLevel, gasLimit)(tuple),
    [...spreadLoadable(selectedGasLevel), ...spreadLoadable(gasLimit)],
  );

  useEffectOnSuccess(gasLevels, (levels) => {
    if (!selectedGasLevel.success) {
      const index = gasLevelMap[defaultGasLevel];
      setSelectedGasLevel(makeLoadable(levels[index]!));
    } else if (selectedGasLevel.data.level !== IGasLevel.Custom) {
      const index = gasLevelMap[selectedGasLevel.data.level];
      setSelectedGasLevel(makeLoadable(levels[index]!));
    }
  });

  useEffectOnSuccess(sufficientFunds, (data) => {
    onMissingGas(!data);
  });

  useEffectOnSuccess(gasLevelAndLimits, ([gasLevel, gasLimits]) => {
    const gasLimitData = Array.isArray(gasLimits) ? gasLimits : [gasLimits];
    onChange(gasLevel, gasLimitData);
  });

  const iconColor =
    backgroundColor === colors.cardHighlight
      ? colors.cardHighlightSecondary
      : colors.cardHighlight;

  return (
    <View style={style}>
      <BaseButton
        className='overflow-hidden rounded-xl'
        disabled={
          !gasLevels.success ||
          !feeData.success ||
          !gasLimit.success ||
          !editable ||
          !balance.success ||
          balance.data === null
        }
        onPress={() => {
          if (Platform.OS !== 'web') {
            Keyboard.dismiss();
          }
          setShowEditSheet(true);
        }}
      >
        <View
          className={cn(
            'flex flex-row items-center justify-between rounded-xl',
            {
              'hover:bg-card-highlight px-4 py-3': hasBackground && editable,
              'px-4 py-3': hasBackground && !editable,
            },
          )}
          style={{
            backgroundColor: hasBackground ? backgroundColor : undefined,
          }}
        >
          <View className='flex flex-row items-center space-x-1.5'>
            <ChainAvatar
              chainInfo={chainInfo}
              size={adjust(16, 2)}
              border={false}
            />
            <Text className='text-text-secondary text-xs font-medium'>
              {'Network Fee'}
            </Text>
          </View>
          {onLoadable(
            composeLoadables(totalFees, sufficientFunds, balance)(tuple),
          )(
            () => (
              <Skeleton
                height={adjust(24, 2)}
                width={120}
                borderRadius={9999}
              />
            ),
            () => (
              <View className='bg-failure/10 rounded-full px-2 py-1'>
                <Text className='text-failure text-xs font-normal'>
                  {'Unable to compute fee'}
                </Text>
              </View>
            ),
            ([fee, sufficientFunds, balance]) =>
              !sufficientFunds || !balance ? (
                <View className='bg-failure/10 rounded-full px-2 py-1'>
                  <Text className='text-failure text-xs font-normal'>
                    {!balance
                      ? `No ${chainInfo.nativeCurrency.symbol} available`
                      : `Insufficient ${chainInfo.nativeCurrency.symbol}`}
                  </Text>
                </View>
              ) : (
                <View className='flex flex-row items-center space-x-1'>
                  <View
                    className='rounded-full px-2 py-1'
                    style={{ backgroundColor: iconColor }}
                  >
                    <Text
                      className='text-xs font-normal'
                      style={{ color: colors.textSecondary }}
                    >
                      {formatMoney(Math.abs(fee.totalFeeUSD))}
                    </Text>
                  </View>
                  <View
                    className='rounded-full px-2 py-1'
                    style={{ backgroundColor: opacity(chainInfo.color, 10) }}
                  >
                    <Text
                      className='text-xs font-normal'
                      style={{ color: chainInfo.color }}
                    >
                      {`${formatCryptoFloat(Math.abs(fee.totalFee))} ${
                        chainInfo.nativeCurrency.symbol
                      }`}
                    </Text>
                  </View>
                </View>
              ),
          )}
        </View>
      </BaseButton>
      {gasLevels.success &&
        feeData.success &&
        gasLimit.success &&
        selectedGasLevel.success && (
          <GasSelectSheet
            chainId={chainId}
            selectedGasLevel={selectedGasLevel.data}
            gasLevels={gasLevels.data}
            gasLimit={gasLimit.data}
            feeData={feeData.data}
            isShowing={showEditSheet}
            onGasLevelChange={(level) => {
              setSelectedGasLevel(makeLoadable(level));
              setShowEditSheet(false);
            }}
            onClose={() => setShowEditSheet(false)}
          />
        )}
    </View>
  );
});
