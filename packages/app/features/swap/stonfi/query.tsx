import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import {
  loadDataFromQuery,
  mapLoadable,
  QueryOptions,
} from '../../../common/utils/query';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { cryptoBalanceToSwapToken } from '../utils';
import { getStonFiRouteInput, useStonFiRoutesQuery } from './utils';

export function useStonFiRouteQuery(
  input: ISwapAssetInput,
  mode: QuickTradeMode,
  options: QueryOptions,
): Loadable<SwapRoute | null> {
  const stonFiRoutesQuery = useStonFiRoutesQuery(
    getStonFiRouteInput(input, mode),
    options,
  );
  const stonFiRoutes = loadDataFromQuery(stonFiRoutesQuery);
  return mapLoadable(stonFiRoutes)((route) => {
    if (!route) {
      return null;
    }
    const fromToken = cryptoBalanceToSwapToken(input.fromAsset!);
    const toToken = cryptoBalanceToSwapToken(input.toAsset!);
    const fromPrice =
      parseFloat(fromToken.priceUSD) *
      parseFloat(ethers.formatUnits(route.offer_units, fromToken.decimals));
    const toPrice =
      parseFloat(toToken.priceUSD) *
      parseFloat(ethers.formatUnits(route.ask_units, toToken.decimals));
    return {
      data: {
        id: 'Ston.fi',
        fromChainId: ChainId.Ton,
        fromAmountUSD: fromPrice.toString(),
        fromAmount: route.offer_units,
        fromToken,
        fromAddress: route.offer_address,
        toChainId: ChainId.Ton,
        toAmountUSD: toPrice.toString(),
        toAmountMin: route.min_ask_units,
        toAmount: route.ask_units,
        toToken,
        toAddress: route.ask_address,
      },
      stonfi: route,
    };
  });
}
