import { QueryObserverOptions } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { LifiQuoteResponse, LifiRoute } from '../../../common/api/lifi/types';
import {
  loadDataFromQuery,
  mapLoadable,
  spreadLoadable,
} from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ISwapAssetInput } from '../types';
import {
  getLifiRouteInput,
  normalizeLifiAddress,
  normalizeLifiChainId,
  useLifiQuotesQuery,
  useLifiRoutesQuery,
} from './utils';

export function useLifiRouteQuery(
  input: ISwapAssetInput,
  wallet: IWallet,
  options: Partial<QueryObserverOptions<LifiRoute[]>>,
) {
  const [routeId, setRouteId] = useState<string | null>(null);

  const handleSetRoute = (routeId: string) => {
    setRouteId(routeId);
  };

  const lifiRoutesQuery = useLifiRoutesQuery(
    getLifiRouteInput(wallet, input),
    options,
  );
  const lifiRoutes = loadDataFromQuery(lifiRoutesQuery, (data): LifiRoute[] =>
    data.map((route) => {
      const fromChainId = normalizeLifiChainId(route.fromChainId);
      const toChainId = normalizeLifiChainId(route.toChainId);
      const steps = route.steps.map((step) => {
        const fromChainId = normalizeLifiChainId(step.action.fromChainId);
        const toChainId = normalizeLifiChainId(step.action.toChainId);
        return {
          ...step,
          action: {
            ...step.action,
            fromChainId,
            toChainId,
            fromAddress: step.action.fromAddress
              ? normalizeLifiAddress(step.action.fromAddress)
              : undefined,
            toAddress: step.action.toAddress
              ? normalizeLifiAddress(step.action.toAddress)
              : undefined,
            fromToken: {
              ...step.action.fromToken,
              address: normalizeLifiAddress(step.action.fromToken.address),
              chainId: fromChainId,
            },
            toToken: {
              ...step.action.toToken,
              address: normalizeLifiAddress(step.action.toToken.address),
              chainId: toChainId,
            },
          },
        };
      });
      return {
        ...route,
        toChainId,
        fromChainId,
        fromAddress: route.fromAddress
          ? normalizeLifiAddress(route.fromAddress)
          : undefined,
        toAddress: route.toAddress
          ? normalizeLifiAddress(route.toAddress)
          : undefined,
        fromToken: {
          ...route.fromToken,
          address: normalizeLifiAddress(route.fromToken.address),
          chainId: fromChainId,
        },
        toToken: {
          ...route.toToken,
          address: normalizeLifiAddress(route.toToken.address),
          chainId: toChainId,
        },
        steps,
      };
    }),
  );
  const lifiRoute = mapLoadable(lifiRoutes)((routes) => {
    const selectedRoute = routes.find((route) => {
      const id = route.id;
      return id === routeId;
    });
    return selectedRoute ?? routes?.[0] ?? null;
  });

  return useMemo(
    () => ({
      route: lifiRoute,
      routes: lifiRoutes,
      setRoute: handleSetRoute,
    }),
    [...spreadLoadable(lifiRoutes), routeId],
  );
}

export function useLifiQuoteQuery(
  input: ISwapAssetInput,
  wallet: IWallet,
  options: Partial<QueryObserverOptions<LifiQuoteResponse>>,
) {
  const lifiQuotesQuery = useLifiQuotesQuery(
    getLifiRouteInput(wallet, input),
    options,
  );
  const lifiQuote = loadDataFromQuery(
    lifiQuotesQuery,
    (data): LifiQuoteResponse => {
      if (!data) return null;
      const fromChainId = input.fromChainId;
      const toChainId = input.toChainId;
      const step = {
        ...data,
        action: {
          ...data.action,
          fromChainId,
          toChainId,
          fromAddress: data.action.fromAddress
            ? normalizeLifiAddress(data.action.fromAddress)
            : undefined,
          toAddress: data.action.toAddress
            ? normalizeLifiAddress(data.action.toAddress)
            : undefined,
          fromToken: {
            ...data.action.fromToken,
            address: normalizeLifiAddress(data.action.fromToken.address),
            chainId: fromChainId,
          },
          toToken: {
            ...data.action.toToken,
            address: normalizeLifiAddress(data.action.toToken.address),
            chainId: toChainId,
          },
        },
      };
      return step;
    },
  );
  return useMemo(() => ({ route: lifiQuote }), [...spreadLoadable(lifiQuote)]);
}
