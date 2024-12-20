import { useQuery } from '@tanstack/react-query';
import { encode } from 'bs58';
import { ethers } from 'ethers';
import {
  JupiterQuoteInput,
  JupiterRoute,
} from '../../../common/api/jupiter/types';
import {
  getJupiterRoute,
  getJupiterTokens,
  getJupiterTransaction,
  getTokenPrices,
} from '../../../common/api/jupiter/utils';
import { NestWalletClient } from '../../../common/api/nestwallet/client';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { useNestWallet } from '../../../provider/nestwallet';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

export function getJupiterRouteInput(
  input: ISwapAssetInput,
  dexes: string[],
  mode: QuickTradeMode,
) {
  if (!isInputValid(input) || dexes.length === 0) return;
  const bigAmount = ethers.parseUnits(
    input.amount,
    input.fromAsset!.tokenMetadata.decimals,
  );
  const sendAmount =
    mode === 'buy'
      ? (bigAmount * 10000n - bigAmount * BigInt(input.fee)) / 10000n
      : bigAmount;
  return {
    inputMint: input.fromAsset?.address!,
    outputMint: input.toAsset?.address!,
    amount: sendAmount.toString(),
    slippageBps: input.slippage * 100,
    dexes,
  };
}

export function useJupiterRoutesQuery(
  input: JupiterQuoteInput | undefined,
  options: QueryOptions,
) {
  const { apiClient } = useNestWallet();
  return useQuery({
    queryKey: ['jupiterRoutesQuery', input],
    queryFn: async () => getJupiterRoute(apiClient, input!),
    ...options,
    enabled: options.enabled && !!input,
  });
}

export function useJupiterTokensQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['jupiterTokensQuery'],
    queryFn: async () => {
      const tokens = await getJupiterTokens();
      return tokens ?? [];
    },
    ...options,
  });
}

export function useJupiterTokenPricesQuery(
  tokens: string[],
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['jupiterTokenPricesQuery', tokens],
    queryFn: async () => await getTokenPrices(tokens),
    ...options,
  });
}

export async function getTransactionFromJupiterRoute(
  apiClient: NestWalletClient,
  wallet: IWallet,
  route: JupiterRoute,
  computeUnitPrice?: bigint,
): Promise<SwapTransaction[]> {
  const tx = await getJupiterTransaction(apiClient, {
    userPublicKey: wallet.address,
    quoteResponse: route,
    computeUnitPrice,
  });
  const swapTx = Buffer.from(tx.swapTransaction, 'base64');
  const txData = encode(swapTx);
  return [
    {
      data: {
        to: '',
        data: txData,
        value: '0',
      },
      chainId: ChainId.Solana,
      type: 'swap',
    },
  ];
}
