import { ethers } from 'ethers';
import { useNestWallet } from '../../../provider/nestwallet';
import { getChainInfo } from '../../chain';
import { FallbackProvider, getRPCRequestFn } from './fallback';
import { ProviderOptions } from './types';

export function getJSONRPCProvider(
  chainId: number,
  rpcOptions?: ProviderOptions,
): ethers.JsonRpcApiProvider {
  const chain = getChainInfo(chainId);
  const rpcUrls = chain.overrideRPCUrls ?? [chain.rpcUrls.default.http[0]!];
  return new FallbackProvider(rpcUrls, chainId, rpcOptions);
}

export function getJSONRPCFunction(chainId: number) {
  const chain = getChainInfo(chainId);
  const rpcUrls = chain.overrideRPCUrls ?? [chain.rpcUrls.default.http[0]!];
  return getRPCRequestFn(rpcUrls);
}

export function usePrivateRPCProvider(chainId: number) {
  const { apiClient } = useNestWallet();
  return getJSONRPCProvider(chainId, { apiClient });
}
