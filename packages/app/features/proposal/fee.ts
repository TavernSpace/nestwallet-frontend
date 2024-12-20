import { ethers } from 'ethers';
import { BasicFeeData } from '../../common/types';
import { IFeeData } from '../../graphql/client/generated/graphql';
import { GasPriceLevel } from './types';

export const transferGasMultiplier = 1;
export const defaultGasMultiplier = 2;

export function getFeeMultiplier(txData?: string | null | undefined): number {
  return txData ? defaultGasMultiplier : transferGasMultiplier;
}

export function getTotalFees(props: {
  feeData: IFeeData | BasicFeeData;
  gasLimit: bigint;
  selectedGasLevel: GasPriceLevel;
}) {
  const { feeData, gasLimit, selectedGasLevel } = props;
  const txFee = gasLimit * selectedGasLevel.estimatedGasPrice;
  const totalFeeBig =
    ('units' in feeData ? 0n : BigInt(feeData.l1DataFee)) + txFee;
  const decimals =
    'units' in feeData
      ? feeData.token.decimals + feeData.additionalDecimals
      : feeData.feeTokenMetadata.decimals;
  const totalFee = parseFloat(
    ethers.formatUnits(totalFeeBig.toString(), decimals),
  );
  const feeTokenPrice = parseFloat(
    'units' in feeData ? feeData.token.price : feeData.feeTokenMetadata.price,
  );
  const totalFeeUSD = totalFee * feeTokenPrice;
  return {
    totalFee,
    totalFeeBig,
    totalFeeUSD,
  };
}
