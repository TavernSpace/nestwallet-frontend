import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import {
  ISignerWallet,
  Loadable,
  SafeTransactionProposalWithNonce,
  TransactionParams,
  Tuple,
} from '../../common/types';
import { QueryOptions } from '../../common/utils/query';
import {
  createSafe,
  safeTransactionFromProposal,
} from '../../features/safe/utils';
import { IFeeData, IGasType } from '../../graphql/client/generated/graphql';
import { useNestWallet } from '../../provider/nestwallet';
import { nullAddress } from '../evm/constants';
import { getJSONRPCProvider, usePrivateRPCProvider } from '../evm/provider';
import { getSafeTxTransactionData } from '../safe/encode';
import { GasPriceLevel } from './types';

export function getTransactionOptions(
  gasLimit: bigint,
  selectedGasLevel: GasPriceLevel,
  nonce?: number,
) {
  if (selectedGasLevel.type === IGasType.Classic) {
    return {
      gasLimit: ethers.toBeHex(gasLimit),
      gasPrice: ethers.toBeHex(selectedGasLevel.gasPrice),
      nonce,
    };
  } else {
    return {
      gasLimit: ethers.toBeHex(gasLimit),
      maxPriorityFeePerGas: ethers.toBeHex(
        selectedGasLevel.maxPriorityFeePerGas,
      ),
      maxFeePerGas: ethers.toBeHex(selectedGasLevel.maxFeePerGas),
      nonce,
    };
  }
}

export function useEncodeTransactionProposalQuery(
  proposal: SafeTransactionProposalWithNonce,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['encodeTransactionProposal', { proposal }],
    queryFn: async () => {
      const safe = await createSafe(proposal.wallet);
      const safeTx = await safeTransactionFromProposal(safe, proposal);
      const encodedTx = getSafeTxTransactionData(safe, safeTx);
      return encodedTx;
    },
    ...options,
  });
}

export function useEstimateGasLimitForSafeTransactionProposalQuery(
  proposal: SafeTransactionProposalWithNonce,
  encodedTx: Loadable<string>,
  executor?: ISignerWallet,
  options?: QueryOptions,
) {
  const provider = usePrivateRPCProvider(proposal.chainId);
  // use nullAddress 0x000....0000 as executor so we don't have to keep
  // reestimating gas when changing executor
  return useQuery({
    queryKey: ['getEstimateGasLimitForExecuteSafeTx', { proposal }],
    queryFn: async () =>
      provider.estimateGas({
        to: proposal.wallet.address,
        from: executor?.address ?? nullAddress,
        data: encodedTx.data,
      }),
    ...options,
    enabled: options?.enabled && encodedTx.success && !!encodedTx.data,
  });
}

export interface IEstimateGasLimitOutput {
  gasLimit: bigint;
}

export function useEstimateGasLimitQuery(
  tx: TransactionParams,
  options?: Omit<UseQueryOptions<IEstimateGasLimitOutput, unknown>, 'queryKey'>,
) {
  // use nullAddress 0x000....0000 as executor so we don't have to keep
  // reestimating gas when changing executor
  const { apiClient } = useNestWallet();
  return useQuery({
    queryKey: ['getEstimateGasLimit', { tx }],
    queryFn: async () => {
      const provider = getJSONRPCProvider(tx.chainId, { apiClient });
      const gasEstimate = await provider.estimateGas({
        to: tx.to,
        from: tx.from,
        value: tx.value,
        data: tx.data,
      });
      return { gasLimit: gasEstimate };
    },
    ...options,
  });
}

export function parseFeeData(feeData: IFeeData): Tuple<GasPriceLevel, 3> {
  if (feeData.classicLevels) {
    return feeData.classicLevels.map((level) => ({
      ...level,
      gasLimit: BigInt(level.gasLimit),
      gasPrice: BigInt(level.gasPrice),
      estimatedGasPrice: BigInt(level.estimatedGasPrice),
    })) as Tuple<GasPriceLevel, 3>;
  } else if (feeData.eip1559Levels) {
    return feeData.eip1559Levels.map((level) => ({
      ...level,
      gasLimit: BigInt(level.gasLimit),
      estimatedGasPrice: BigInt(level.estimatedGasPrice),
      lastBaseFeePerGas: BigInt(level.lastBaseFeePerGas),
      maxFeePerGas: BigInt(level.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(level.maxPriorityFeePerGas),
    })) as Tuple<GasPriceLevel, 3>;
  } else {
    throw new Error('Unable to find gas data for transaction');
  }
}
