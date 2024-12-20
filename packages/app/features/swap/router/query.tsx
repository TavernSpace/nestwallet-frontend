import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import {
  loadDataFromQuery,
  mapLoadable,
  QueryOptions,
} from '../../../common/utils/query';
import { ISwapAssetInput, SwapRoute, SwapToken } from '../types';
import { getRouterRouteInput, useRouterRoutesQuery } from './utils';

export function useRouterRouteQuery(
  input: ISwapAssetInput,
  options?: QueryOptions,
): Loadable<SwapRoute | null> {
  const routerRoutesQuery = useRouterRoutesQuery(
    getRouterRouteInput(input),
    options,
  );
  const routerRoutes = loadDataFromQuery(routerRoutesQuery);
  return mapLoadable(routerRoutes)((route): SwapRoute | null => {
    if (!route) {
      return null;
    }
    const fromAmount = route.source.tokenAmount;
    const toAmount = route.destination.tokenAmount;
    const fromToken: SwapToken = {
      chainId: input.fromChainId,
      address: route.fromTokenAddress,
      symbol: route.source.asset.symbol,
      decimals: route.source.asset.decimals,
      name: route.source.asset.name,
      logoURI: input.fromAsset!.tokenMetadata.imageUrl,
      priceUSD: input.fromAsset!.tokenMetadata.price,
    };
    const toToken: SwapToken = {
      chainId: input.toChainId,
      address: route.toTokenAddress,
      symbol: route.destination.asset.symbol,
      decimals: route.destination.asset.decimals,
      name: route.destination.asset.name,
      logoURI: input.toAsset!.tokenMetadata.imageUrl,
      priceUSD: input.toAsset!.tokenMetadata.price,
    };
    const fromAmountUSD =
      parseFloat(ethers.formatUnits(fromAmount, fromToken.decimals)) *
      parseFloat(fromToken.priceUSD);
    const toAmountUSD =
      parseFloat(ethers.formatUnits(toAmount, toToken.decimals)) *
      parseFloat(toToken.priceUSD);
    const slippageMultiplier = BigInt(Math.round(10000 - input.slippage * 100));
    const toAmountMin = (BigInt(toAmount) * slippageMultiplier) / 10000n;
    return {
      data: {
        id: 'Router',
        fromChainId: fromToken.chainId,
        fromAmountUSD: fromAmountUSD.toString(),
        fromAmount,
        fromToken,
        fromAddress: fromToken.address,
        toChainId: toToken.chainId,
        toAmountUSD: toAmountUSD.toString(),
        toAmount,
        toAmountMin: toAmountMin.toString(),
        toToken,
        toAddress: toToken.address,
      },
      router: route,
    };
  });
}
