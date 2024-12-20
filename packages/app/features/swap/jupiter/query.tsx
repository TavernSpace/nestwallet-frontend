import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import {
  QueryOptions,
  loadDataFromQuery,
  mapLoadable,
} from '../../../common/utils/query';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { cryptoBalanceToSwapToken } from '../utils';
import { getJupiterRouteInput, useJupiterRoutesQuery } from './utils';

export function useJupiterRouteQuery(
  input: ISwapAssetInput,
  dexes: string[],
  mode: QuickTradeMode,
  options: QueryOptions,
): Loadable<SwapRoute | null> {
  const jupiterRoutesQuery = useJupiterRoutesQuery(
    getJupiterRouteInput(input, dexes, mode),
    options,
  );
  const jupiterRoute = loadDataFromQuery(jupiterRoutesQuery);
  return mapLoadable(jupiterRoute)((route): SwapRoute | null => {
    if (!route) {
      return null;
    }
    const fromToken = {
      ...cryptoBalanceToSwapToken(input.fromAsset!),
      priceUSD:
        route.inputPriceUSD === '' || parseFloat(route.inputPriceUSD) === 0
          ? input.fromAsset?.tokenMetadata.price || '0'
          : route.inputPriceUSD,
    };
    const fromAmountUSD =
      parseFloat(ethers.formatUnits(route.inAmount, fromToken.decimals)) *
      parseFloat(fromToken.priceUSD);
    const toToken = {
      ...cryptoBalanceToSwapToken(input.toAsset!),
      priceUSD:
        route.outputPriceUSD === '' || parseFloat(route.outputPriceUSD) === 0
          ? input.toAsset?.tokenMetadata.price &&
            parseFloat(input.toAsset.tokenMetadata.price) !== 0
            ? input.toAsset.tokenMetadata.price
            : (
                fromAmountUSD *
                Math.max(0, 1 - parseFloat(route.priceImpactPct))
              ).toString()
          : route.outputPriceUSD,
    };
    const bigAmount = BigInt(route.outAmount);
    const slippageMultiplier = BigInt(Math.round(10000 - input.slippage * 100));
    const bigMinAmount = (bigAmount * slippageMultiplier) / 10000n;
    const receiveAmount =
      mode === 'sell'
        ? (bigAmount * 10000n - bigMinAmount * BigInt(input.fee)) / 10000n
        : bigAmount;
    return {
      data: {
        id: 'Jupiter',
        fromChainId: ChainId.Solana,
        fromAmountUSD: fromAmountUSD.toString(),
        fromAmount: route.inAmount,
        fromToken,
        fromAddress: route.inputMint,
        toChainId: ChainId.Solana,
        toAmountUSD: (
          parseFloat(ethers.formatUnits(receiveAmount, toToken.decimals)) *
          parseFloat(toToken.priceUSD)
        ).toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: receiveAmount.toString(),
        toToken,
        toAddress: route.outputMint,
      },
      jupiter: {
        ...route,
        fee: input.fee,
      },
    };
  });
}
