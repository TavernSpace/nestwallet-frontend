import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import {
  loadDataFromQuery,
  mapLoadable,
  QueryOptions,
} from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { cryptoBalanceToSwapToken } from '../utils';
import { getDeDustRouteInput, useDeDustRoutesQuery } from './utils';

export function useDeDustRouteQuery(
  input: ISwapAssetInput,
  wallet: IWallet,
  mode: QuickTradeMode,
  options: QueryOptions,
): Loadable<SwapRoute | null> {
  const deDustRoutesQuery = useDeDustRoutesQuery(
    getDeDustRouteInput(input, mode),
    options,
  );
  const deDustRoutes = loadDataFromQuery(deDustRoutesQuery);

  return mapLoadable(deDustRoutes)((resp) => {
    if (!resp || resp.route.length !== 1 || !input.toAccount) {
      return null;
    }
    const steps = resp.route[0]!;
    // TODO: multihop routes
    if (steps.length !== 1) {
      return null;
    }
    const route = steps[0]!;
    const fromToken = cryptoBalanceToSwapToken(input.fromAsset!);
    const toToken = cryptoBalanceToSwapToken(input.toAsset!);
    const fromPrice =
      parseFloat(fromToken.priceUSD) *
      parseFloat(ethers.formatUnits(route.amountIn, fromToken.decimals));
    const knownPrice = parseFloat(toToken.priceUSD);
    const routePrice = resp.price ? parseFloat(resp.price) : 0;
    const validPrice =
      isNaN(knownPrice) || knownPrice === 0 ? routePrice : knownPrice;
    const toPrice =
      validPrice *
      parseFloat(ethers.formatUnits(route.amountOut, toToken.decimals));
    return {
      data: {
        id: 'DeDust',
        fromChainId: ChainId.Ton,
        fromAmountUSD: fromPrice.toString(),
        fromAmount: route.amountIn,
        fromToken,
        fromAddress: wallet.address,
        toChainId: ChainId.Ton,
        toAmountUSD: toPrice.toString(),
        toAmountMin: route.amountOut,
        toAmount: route.amountOut,
        toToken,
        toAddress: input.toAccount!.address,
      },
      dedust: [route],
    };
  });
}
