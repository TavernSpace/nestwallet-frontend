import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { QueryOptions } from '../../../common/utils/query';
import { SmartSolanaRpcClient } from './smart-client';

export function useComputeUnitsQuery(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: [
      'queryComputeUnitsSolana',
      {
        instructions: instructions.map((ins) => ins.data.toString()),
        payer: payer.toBase58(),
      },
    ],
    queryFn: async () => {
      const client = new SmartSolanaRpcClient();
      return client.getComputeUnits(instructions, payer, lookupTables);
    },
    ...options,
  });
}

export function useComputeUnitPriceQuery(
  accountKeys: string[] = [],
  priorityLimit = 20_000_000,
  percentile = 95,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: [
      'queryComputeUnitsPriceSolana',
      {
        accountKeys,
        priorityLimit,
        percentile,
      },
    ],
    queryFn: async () => {
      const client = new SmartSolanaRpcClient();
      const priorityFeeRecommendation = await client.getMedianPriorityFee(
        percentile,
        accountKeys,
      );
      return Math.min(priorityFeeRecommendation, priorityLimit);
    },
    ...options,
  });
}
