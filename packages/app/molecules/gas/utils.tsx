import { isArray } from 'lodash';
import { BasicFeeData, Tuple } from '../../common/types';
import { getChainInfo } from '../../features/chain';
import { getTotalFees } from '../../features/proposal/fee';
import { parseFeeData } from '../../features/proposal/gas';
import {
  GasPriceClassicLevel,
  GasPriceEip1559Level,
  GasPriceLevel,
} from '../../features/proposal/types';
import {
  IFeeData,
  IGasLevel,
  IGasType,
} from '../../graphql/client/generated/graphql';

export const gasLevelMap: Record<IGasLevel, number> = {
  [IGasLevel.Slow]: 0,
  [IGasLevel.Standard]: 1,
  [IGasLevel.Fast]: 2,
  // default to 1
  [IGasLevel.Custom]: 1,
  [IGasLevel.Site]: 1,
};

export function indexToGasLevel(index?: number) {
  return index === 2
    ? IGasLevel.Fast
    : index === 1
    ? IGasLevel.Standard
    : index === 0
    ? IGasLevel.Slow
    : undefined;
}

export function aggregateTotalFees(
  feeData: IFeeData | IFeeData[] | BasicFeeData,
  gasLimits: bigint | bigint[],
  gasLevel: GasPriceLevel,
) {
  const totalGasLimit = Array.isArray(gasLimits)
    ? gasLimits.reduce((a, b) => a + b, 0n)
    : gasLimits;
  const aggFeeData = isArray(feeData)
    ? {
        ...feeData[0]!,
        l1DataFee: feeData.reduce((acc, cur) => cur.l1DataFee, 0),
      }
    : feeData;
  return getTotalFees({
    feeData: aggFeeData,
    gasLimit: totalGasLimit,
    selectedGasLevel: gasLevel,
  });
}

export function customGasLevel(
  fee: bigint,
  chainId: number,
  gasLimit: bigint,
): GasPriceLevel {
  const gasType = getChainInfo(chainId).gasType;
  if (gasType === IGasType.Classic) {
    const gas: GasPriceClassicLevel = {
      estimatedGasPrice: fee,
      estimatedTimeSeconds: 0,
      gasLimit,
      gasPrice: fee,
      level: IGasLevel.Custom,
      type: IGasType.Classic,
    };
    return gas;
  } else {
    const maxFee = fee;
    const gas: GasPriceEip1559Level = {
      estimatedGasPrice: maxFee,
      estimatedTimeSeconds: 0,
      gasLimit,
      // TODO: this is wrong but this field is not used so it should be fine
      lastBaseFeePerGas: 0n,
      level: IGasLevel.Custom,
      maxFeePerGas: maxFee,
      maxPriorityFeePerGas: maxFee,
      type: IGasType.Eip1559,
    };
    return gas;
  }
}

export function feeDataToGasLevels(data: IFeeData | BasicFeeData | IFeeData[]) {
  const feeData = isArray(data) ? data[0]! : data;
  if ('units' in feeData) {
    const levels: Tuple<GasPriceLevel, 3> = [
      {
        estimatedGasPrice: feeData.units[0],
        estimatedTimeSeconds: 30,
        gasLimit: 0n,
        gasPrice: feeData.units[0],
        level: IGasLevel.Slow,
        type: IGasType.Classic,
      },
      {
        estimatedGasPrice: feeData.units[1],
        estimatedTimeSeconds: 15,
        gasLimit: 0n,
        gasPrice: feeData.units[1],
        level: IGasLevel.Standard,
        type: IGasType.Classic,
      },
      {
        estimatedGasPrice: feeData.units[2],
        estimatedTimeSeconds: 5,
        gasLimit: 0n,
        gasPrice: feeData.units[2],
        level: IGasLevel.Fast,
        type: IGasType.Classic,
      },
    ];
    return levels;
  } else {
    return parseFeeData(feeData);
  }
}
