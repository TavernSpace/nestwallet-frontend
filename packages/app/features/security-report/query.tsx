import { PublicKey } from '@solana/web3.js';
import { QueryObserverOptions, useQuery } from '@tanstack/react-query';
import { EvmGoPlusResponse, GoPlusInput } from '../../common/api/goplus/types';
import { getEvmGoPlusReport } from '../../common/api/goplus/utils';
import { RugCheckQueryInput } from '../../common/api/rugcheck/types';
import { getRugCheckReport } from '../../common/api/rugcheck/utils';
import { QueryOptions } from '../../common/utils/query';
import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { isValidTokenAddress } from '../blockchain/utils';
import { getSolanaConnection } from '../svm/utils';

export function useRugCheckReportQuery(
  input: RugCheckQueryInput | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['rugCheckReportQuery', input],
    queryFn: async () => getRugCheckReport(input!.tokenAddress),
    ...options,
    enabled:
      options?.enabled &&
      !!input &&
      isValidTokenAddress(IBlockchainType.Svm, input.tokenAddress),
  });
}

export function useEvmGoPlusReportQuery(
  input: GoPlusInput | undefined,
  options?: Partial<QueryObserverOptions<EvmGoPlusResponse>>,
) {
  return useQuery({
    queryKey: ['evmGoPlusReportQuery', input],
    queryFn: async () =>
      getEvmGoPlusReport(input!.chainId, input!.tokenAddress),
    ...options,
    enabled:
      options?.enabled &&
      !!input &&
      isValidTokenAddress(IBlockchainType.Evm, input.tokenAddress),
  });
}

export function useMultipleParsedAccountsQuery(
  input: PublicKey[] | undefined,
  options?: QueryOptions,
) {
  const connection = getSolanaConnection();
  return useQuery({
    queryKey: ['multipleParsedAccountsQuery', input],
    queryFn: () => connection.getMultipleParsedAccounts(input!),
    ...options,
    enabled: options?.enabled && !!input,
  });
}
