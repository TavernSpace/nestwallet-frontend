import { ethers } from 'ethers';
import { NestWalletClient } from '../../../common/api/nestwallet/client';
import { RpcResponse } from '../../../common/api/nestwallet/types';
import { getChainInfo } from '../../chain';
import { ProviderOptions } from './types';

export class FallbackProvider extends ethers.BrowserProvider {
  constructor(
    rpcUrls: Array<string>,
    network: number,
    options?: ProviderOptions,
  ) {
    const eip1993Provider = {
      request: options?.apiClient
        ? getPrivateRPCRequestFn(
            options.apiClient,
            network,
            options?.mevProtection,
          )
        : getRPCRequestFn(rpcUrls),
    };
    const networkData = {
      chainId: network,
      name: getChainInfo(network).name,
      ensAddress: options?.ensAddress,
    };
    super(eip1993Provider, networkData);
  }
}

function getPrivateRPCRequestFn(
  apiClient: NestWalletClient,
  chainId: number,
  mevProtection = false,
) {
  return async (request: {
    method: string;
    params?: Array<any> | Record<string, any>;
  }) => {
    const { method, params } = request;
    return apiClient.sendEVMRPCRequest(chainId, {
      method:
        method === 'eth_sendRawTransaction' && mevProtection
          ? 'eth_sendPrivateTransaction'
          : method,
      params,
    });
  };
}

export function getRPCRequestFn(rpcUrls: string[]) {
  return async (request: {
    method: string;
    params?: Array<any> | Record<string, any>;
  }) => {
    const { method, params } = request;
    let result: RpcResponse<any> | undefined;
    for (const rpcUrl of rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ id: '1', jsonrpc: '2.0', method, params }),
        });
        const isOk = response.status >= 200 && response.status <= 300;
        if (!isOk) {
          continue;
        }
        result = await response.json();
        break;
      } catch (err) {
        // if we get an error we should try the next rpcUrl
        continue;
      }
    }
    if (!result) {
      throw new Error(`failed to fetch method=${method}`);
    }
    if (result.error) {
      throw result.error;
    }
    // otherwise return result.result which could be null
    return result.result;
  };
}
