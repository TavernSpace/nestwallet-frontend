import { useQuery } from '@tanstack/react-query';
import { toNano } from '@ton/core';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { TonMessage } from '../../tvm/types';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';
import {
  calculateGasPumpBuyAmount,
  calculateGasPumpSellAmount,
  getGasPumpMetadata,
  prepareBuyTransaction,
  prepareSellTransaction,
} from './gaspump';
import { GasPumpRoute, GasPumpRoutesInput } from './types';

export function getGasPumpRouteInput(
  input: ISwapAssetInput,
): GasPumpRoutesInput | undefined {
  if (!isInputValid(input)) {
    return;
  }
  const fromAsset = input.fromAsset!;
  const toAsset = input.toAsset!;
  const isFromAssetNative = fromAsset?.tokenMetadata.isNativeToken;
  const isToAssetNative = toAsset?.tokenMetadata.isNativeToken;
  if (isToAssetNative) {
    return {
      mode: 'sell',
      fromAsset: fromAsset,
      toAsset: toAsset,
      amount: input.amount,
    };
  }
  if (isFromAssetNative) {
    return {
      mode: 'buy',
      fromAsset: fromAsset,
      toAsset: toAsset,
      amount: input.amount,
    };
  }
  return;
}
export function useGasPumpRoutesQuery(
  input: GasPumpRoutesInput | undefined,
  options: QueryOptions,
) {
  return useQuery({
    queryKey: ['gasPumpRoutesQuery', input],
    queryFn: async () => getGasPumpRoute(input!),
    ...options,
    enabled: options.enabled && !!input,
  });
}

export async function getGasPumpRoute(
  input: GasPumpRoutesInput,
): Promise<GasPumpRoute> {
  const fromAsset = input.fromAsset;
  const toAsset = input.toAsset;
  const amount = toNano(input.amount).toString();
  const fromTokenMetadata =
    input.mode === 'sell' ? await getGasPumpMetadata(fromAsset?.address) : null;
  const toTokenMetadata =
    input.mode === 'buy' ? await getGasPumpMetadata(toAsset?.address) : null;
  if (fromTokenMetadata) {
    const toAmount = await calculateGasPumpSellAmount(
      amount,
      fromAsset.address,
    );
    return {
      txType: 'sell',
      inputMint: fromAsset.address,
      outputMint: toAsset.address,
      inAmount: amount,
      outAmount: toAmount,
      tokenMetadata: fromTokenMetadata,
    };
  }
  if (toTokenMetadata) {
    const toAmount = await calculateGasPumpBuyAmount(amount, toAsset.address);
    if (parseFloat(toAmount) <= 0) {
      //buying very small amount (under 0.12 ton) is not allowed since gas pump takes a flat fee of 0.12 ton
      throw new Error('Minimum buy: 0.12 ton');
    }
    return {
      txType: 'buy',
      inputMint: fromAsset.address,
      outputMint: toAsset.address,
      inAmount: amount,
      outAmount: toAmount,
      tokenMetadata: toTokenMetadata,
    };
  }
  throw new Error('Not a gaspump token');
}

export async function getTransactionFromGasPumpRoute(
  wallet: IWallet,
  route: GasPumpRoute,
): Promise<SwapTransaction[]> {
  let tx: TonMessage;
  if (route.txType === 'buy') {
    tx = await prepareBuyTransaction(route.outputMint, route.inAmount);
  } else if (route.txType === 'sell') {
    tx = await prepareSellTransaction(
      route.inputMint,
      route.inAmount,
      wallet.address,
    );
  } else {
    throw new Error('Invalid txType');
  }
  return [
    {
      data: {
        to: tx.address,
        data: tx.body!,
        value: tx.amount.toString(),
      },
      chainId: ChainId.Ton,
      type: 'swap',
    },
  ];
}
