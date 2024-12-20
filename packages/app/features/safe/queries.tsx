import { useQuery } from '@tanstack/react-query';
import { QueryOptions } from '../../common/utils/query';
import { getSafeApiKit } from './utils';

export function safeInfoQueryKey(chainId: number, address: string) {
  return ['querySafeInfo', { chainId, address }];
}

export function useSafeInfoQuery(
  chainId: number,
  address: string,
  options?: QueryOptions,
) {
  const safeApi = getSafeApiKit(chainId);
  return useQuery({
    queryKey: safeInfoQueryKey(chainId, address),
    queryFn: async () => safeApi.getSafeInfo(address),
    ...options,
  });
}

export function useSafeCreationInfoQuery(
  chainId: number,
  address: string,
  options?: QueryOptions,
) {
  const safeApi = getSafeApiKit(chainId);
  return useQuery({
    queryKey: ['querySafeCreation', { address, chainId }],
    queryFn: async () => safeApi.getSafeCreationInfo(address),
    ...options,
  });
}
