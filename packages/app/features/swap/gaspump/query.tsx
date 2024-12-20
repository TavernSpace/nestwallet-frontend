import { toNano } from '@ton/core';
import { Loadable } from '../../../common/types';
import {
  QueryOptions,
  loadDataFromQuery,
  mapLoadable,
} from '../../../common/utils/query';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { cryptoBalanceToSwapToken } from '../utils';
import { calculateGasPumpTokenPrice } from './gaspump';
import { getGasPumpRouteInput, useGasPumpRoutesQuery } from './utils';

export function useGasPumpRouteQuery(
  input: ISwapAssetInput,
  options: QueryOptions,
): Loadable<SwapRoute | null> {
  const gasPumpRoutesQuery = useGasPumpRoutesQuery(
    getGasPumpRouteInput(input),
    options,
  );
  const gasPumpRoutes = loadDataFromQuery(gasPumpRoutesQuery);
  return mapLoadable(gasPumpRoutes)((route) => {
    if (!route) {
      return null;
    }
    const fromToken = cryptoBalanceToSwapToken(input.fromAsset!);
    const toToken = cryptoBalanceToSwapToken(input.toAsset!);
    const price = calculateGasPumpTokenPrice(route.tokenMetadata) ?? 0;
    const toAmountUSD = (
      route.txType === 'sell'
        ? parseFloat(route.outAmount) * parseFloat(toToken.priceUSD)
        : parseFloat(route.outAmount) * price * parseFloat(fromToken.priceUSD)
    ).toString();
    return {
      data: {
        id: 'gaspump',
        fromChainId: ChainId.Ton,
        fromAmountUSD: '0',
        fromAmount: route.inAmount,
        fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.Ton,
        toAmountUSD,
        toAmountMin: '0',
        toAmount: toNano(route.outAmount).toString(),
        toToken,
        toAddress: toToken.address,
      },
      gasPump: route,
    };
  });
}
