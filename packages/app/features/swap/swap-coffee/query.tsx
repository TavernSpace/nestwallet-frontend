import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import {
  loadDataFromQuery,
  mapLoadable,
  QueryOptions,
} from '../../../common/utils/query';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute, SwapToken } from '../types';
import { getSwapCoffeeInput, useSwapCoffeeRoutesQuery } from './utils';

export function useSwapCoffeeRouteQuery(
  input: ISwapAssetInput,
  options?: QueryOptions,
): Loadable<SwapRoute | null> {
  const swapCoffeeRoutesQuery = useSwapCoffeeRoutesQuery(
    getSwapCoffeeInput(input),
    options,
  );
  const swapCoffeeRoutes = loadDataFromQuery(swapCoffeeRoutesQuery);
  return mapLoadable(swapCoffeeRoutes)((route) => {
    if (!route) {
      return null;
    }
    const fromToken: SwapToken = {
      chainId: ChainId.Ton,
      address: route.input_token.address.address,
      symbol: route.input_token.metadata.symbol,
      decimals: route.input_token.metadata.decimals,
      name: route.input_token.metadata.name,
      logoURI: route.input_token.metadata.image_url,
      priceUSD: input.fromAsset!.tokenMetadata.price,
    };
    const toToken: SwapToken = {
      chainId: ChainId.Ton,
      address: route.output_token.address.address,
      symbol: route.output_token.metadata.symbol,
      decimals: route.output_token.metadata.decimals,
      name: route.output_token.metadata.name,
      logoURI: route.output_token.metadata.image_url,
      priceUSD: input.toAsset!.tokenMetadata.price,
    };
    const fromAmount = ethers.parseUnits(
      route.input_amount.toFixed(fromToken.decimals),
      fromToken.decimals,
    );
    const toAmount = ethers.parseUnits(
      route.output_amount.toFixed(toToken.decimals),
      toToken.decimals,
    );
    const slippageMultiplier = BigInt(Math.round(10000 - input.slippage * 100));
    const toAmountMin = (toAmount * slippageMultiplier) / 10000n;
    return {
      data: {
        id: 'swap.coffee',
        fromChainId: ChainId.Ton,
        fromAmountUSD: route.input_usd.toString(),
        fromAmount: fromAmount.toString(),
        fromToken,
        fromAddress: toToken.address,
        toChainId: ChainId.Ton,
        toAmountUSD: route.output_usd.toString(),
        toAmountMin: toAmountMin.toString(),
        toAmount: toAmount.toString(),
        toToken,
        toAddress: toToken.address,
      },
      swapCoffee: route,
    };
  });
}
