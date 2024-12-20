import { PublicKey } from '@solana/web3.js';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { solana } from '../../chain/solana';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';
import { buyOrSellMoonshotToken } from './moonshot';
import { MoonshotRoute, MoonshotTokenMetadata } from './types';

export async function getTransactionFromMoonshotRoute(
  wallet: IWallet,
  route: MoonshotRoute,
  computeUnitPrice?: bigint,
): Promise<SwapTransaction[]> {
  const tx = await buyOrSellMoonshotToken(
    route,
    new PublicKey(wallet.address),
    computeUnitPrice,
  );
  return [
    {
      data: {
        to: '',
        data: tx,
        value: '0',
      },
      chainId: solana.id,
      type: 'swap',
    },
  ];
}

export function useMoonshotTransaction(
  props: {
    wallet: IWallet;
    route: MoonshotRoute;
  },
  options?: Omit<UseQueryOptions<SwapTransaction[]>, 'queryKey'>,
) {
  const { wallet, route } = props;
  return useQuery({
    queryKey: ['getMoonshotTransaction', { wallet, route }],
    queryFn: async () => {
      return getTransactionFromMoonshotRoute(wallet, route);
    },
    ...options,
  });
}

export async function getMoonshotTokenInfo(
  mintAddress?: string,
): Promise<MoonshotTokenMetadata | null> {
  if (!mintAddress) {
    return null;
  }
  const url = `https://api.moonshot.cc/token/v1/solana/${mintAddress}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {},
  });
  if (!response.ok) {
    return null;
  }
  const data: MoonshotTokenMetadata = await response.json();
  if (data.dexId !== 'moonshot') {
    return null;
  }
  return data;
}

export function getMoonshotInput(input: ISwapAssetInput) {
  if (!isInputValid(input)) return undefined;
  return {
    amount: ethers.formatUnits(
      ethers.parseUnits(input.amount, input.fromAsset!.tokenMetadata.decimals),
      input.fromAsset!.tokenMetadata.decimals,
    ),
    fromAsset: input.fromAsset!,
    toAsset: input.toAsset!,
    slippage: input.slippage,
    fee: input.fee,
  };
}
