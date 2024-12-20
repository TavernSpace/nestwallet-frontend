import { ethers } from 'ethers';
import { partition, uniq } from 'lodash';
import { useMemo } from 'react';
import { JupiterTokenPriceResponse } from '../../common/api/jupiter/types';
import { Loadable, VoidPromiseFunction } from '../../common/types';
import { withDiscardedAsyncResult } from '../../common/utils/functions';
import {
  QueryOptions,
  altCondLoadable,
  altLoadableError,
  firstWith,
  loadDataFromQuery,
  makeLoadable,
  makeLoadableError,
  makeLoadableLoading,
  mapLoadable,
  spreadLoadable,
  useLoadDataFromQuery,
} from '../../common/utils/query';
import {
  IBlockchainType,
  ICryptoBalance,
  IPositionType,
  ITokenMetadata,
  IWallet,
  useTokenMetadataQuery,
} from '../../graphql/client/generated/graphql';
import { QuickTradeMode } from '../../screens/quick-trade/types';
import {
  getChainInfo,
  onBlockchain,
  swapSupportedChainsForBlockchain,
} from '../chain';
import { ChainId } from '../chain/chain';
import {
  useEvmTokenMetadataQuery,
  useMultichainTokenMetadataQuery,
  useTvmTokenMetadataQuery,
} from '../crypto/metadata';
import { isNativeAddress } from '../crypto/utils';
import { nativeSolAddress } from '../svm/constants';
import { nativeTonAddress } from '../tvm/constants';
import { normalizeTONAddress } from '../tvm/utils';
import { useSwappableDeDustTokensQuery } from './dedust/token';
import { useFourMemeRouteQuery } from './fourmeme/query';
import { useGasPumpRouteQuery } from './gaspump/query';
import { useJupiterRouteQuery } from './jupiter/query';
import { useSwappableJupiterTokensQuery } from './jupiter/tokens';
import { useJupiterTokenPricesQuery } from './jupiter/utils';
import { useLifiQuoteQuery } from './lifi/query';
import { useSwappableLifiTokensQuery } from './lifi/tokens';
import { parseLifiQuote } from './lifi/utils';
import { useMoonshotRouteQuery } from './moonshot/query';
import { usePumpFunRouteQuery } from './pump-fun/query';
import { useRouterRouteQuery } from './router/query';
import { useSwappableStonFiTokensQuery } from './stonfi/tokens';
import { useSwapCoffeeRouteQuery } from './swap-coffee/query';
import { ISwapAssetInput, SwapRoute } from './types';
import {
  getDefaultSwappableTokens,
  useSolanaDexes,
  useSvmTokenTypeQuery,
} from './utils';

export function useSwappableTokensQuery(
  blockchain: IBlockchainType,
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
) {
  const lifiSwappableTokens = useSwappableLifiTokensQuery(cryptoBalances, {
    ...options,
    enabled: !!(options?.enabled && blockchain === IBlockchainType.Evm),
  });
  const jupiterSwappableTokens = useSwappableJupiterTokensQuery(
    cryptoBalances,
    {
      ...options,
      enabled: !!(options?.enabled && blockchain === IBlockchainType.Svm),
    },
  );
  const tonSwappableTokens = useTonSwappableTokensQuery(
    blockchain,
    cryptoBalances,
    options,
  );
  const swappable = onBlockchain(blockchain)(
    () => lifiSwappableTokens,
    () => jupiterSwappableTokens,
    () => tonSwappableTokens,
  );
  return altLoadableError(swappable)(() =>
    mapLoadable(cryptoBalances)((crypto) =>
      getDefaultSwappableTokens(crypto, blockchain),
    ),
  );
}

export function useUnknownSwappableTokenQuery(
  chainId: number,
  address: string,
  options: QueryOptions,
): Loadable<ICryptoBalance> {
  const unknownEvmToken = useUnknownEvmSwappableTokenQuery(chainId, address, {
    ...options,
    enabled:
      options.enabled !== false &&
      chainId !== ChainId.Solana &&
      chainId !== ChainId.Ton,
  });
  const unknownSvmToken = useUnknownSvmSwappableTokenQuery(address, {
    ...options,
    enabled: options.enabled !== false && chainId === ChainId.Solana,
  });
  const unknownTvmToken = useUnknownTvmSwappableTokenQuery(address, {
    ...options,
    enabled: options.enabled !== false && chainId === ChainId.Ton,
  });
  return chainId === ChainId.Solana
    ? unknownSvmToken
    : chainId === ChainId.Ton
    ? unknownTvmToken
    : unknownEvmToken;
}

function useUnknownEvmSwappableTokenQuery(
  chainId: number,
  address: string,
  options: QueryOptions,
): Loadable<ICryptoBalance> {
  const unknownTokenQuery = useEvmTokenMetadataQuery(address, chainId, options);
  return useLoadDataFromQuery(unknownTokenQuery, (token) => ({
    address: ethers.getAddress(token.address),
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId,
    isHidden: false,
    positionType: IPositionType.Asset,
    tokenMetadata: token,
  }));
}

function useUnknownSvmSwappableTokenQuery(
  address: string,
  options: QueryOptions,
): Loadable<ICryptoBalance> {
  const tokenMetadataQuery = useTokenMetadataQuery(
    { input: { address, chainId: ChainId.Solana } },
    options,
  );
  return useLoadDataFromQuery(tokenMetadataQuery, (token) => ({
    address: token.tokenMetadata.address,
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId: ChainId.Solana,
    isHidden: false,
    positionType: IPositionType.Asset,
    tokenMetadata: token.tokenMetadata,
  }));
}

function useUnknownTvmSwappableTokenQuery(
  address: string,
  options: QueryOptions,
): Loadable<ICryptoBalance> {
  const unknownTokenQuery = useTvmTokenMetadataQuery(address, options);
  return useLoadDataFromQuery(unknownTokenQuery, (token) => ({
    address: token.address,
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId: ChainId.Ton,
    isHidden: false,
    positionType: IPositionType.Asset,
    tokenMetadata: token,
  }));
}

export function useUnknownMultichainSwappableTokenQuery(
  address: string,
  blockchain: IBlockchainType,
  options: QueryOptions,
): Loadable<ICryptoBalance[]> {
  // TODO: clean this up
  const unknownTokenQuery = useMultichainTokenMetadataQuery(
    address,
    swapSupportedChainsForBlockchain[blockchain].map((chain) => chain.id),
    {
      ...options,
      enabled: options.enabled !== false && blockchain !== IBlockchainType.Svm,
    },
  );
  const unknownToken = loadDataFromQuery(unknownTokenQuery);

  const tokenMetadataQuery = useTokenMetadataQuery(
    { input: { address, chainId: ChainId.Solana } },
    {
      enabled: options.enabled !== false && blockchain === IBlockchainType.Svm,
    },
  );
  const tokenMetadata = loadDataFromQuery(
    tokenMetadataQuery,
    (data) => data.tokenMetadata as ITokenMetadata,
  );

  return useMemo(() => {
    if (blockchain !== IBlockchainType.Svm) {
      return mapLoadable(unknownToken)((tokens) =>
        tokens
          .filter(([_, token]) => token !== null)
          .map(([chain, token]) => {
            const address = onBlockchain(blockchain)(
              () => ethers.getAddress(token!.address),
              () => token!.address,
              () => normalizeTONAddress(token!.address),
            );
            return {
              address,
              balance: '0',
              balanceChange: { absolute1D: 0, percent1D: 0 },
              balanceInUSD: '0',
              chainId: chain,
              isHidden: false,
              positionType: IPositionType.Asset,
              tokenMetadata: token!,
            };
          }),
      );
    } else {
      return mapLoadable(tokenMetadata)((data) => [
        {
          address,
          balance: '0',
          balanceChange: { absolute1D: 0, percent1D: 0 },
          balanceInUSD: '0',
          chainId: ChainId.Solana,
          isHidden: false,
          positionType: IPositionType.Asset,
          tokenMetadata: data,
        },
      ]);
    }
  }, [
    address,
    blockchain,
    ...spreadLoadable(tokenMetadata),
    ...spreadLoadable(unknownToken),
  ]);
}

export function useSwapRouteQuery(
  input: ISwapAssetInput,
  wallet: IWallet,
  disabled: boolean = false,
  mode: QuickTradeMode = 'buy',
  commonOnly = false,
): { route: Loadable<SwapRoute | null> } {
  const chainId = input.fromChainId;
  const isFromEthereum = chainId !== ChainId.Solana && chainId !== ChainId.Ton;
  const isToEthereum =
    input.toChainId !== ChainId.Solana && input.toChainId !== ChainId.Ton;
  const isCrossChain =
    (isFromEthereum && !isToEthereum) || (!isFromEthereum && isToEthereum);

  // Solana
  const solanaQueryOptions = (enabled: boolean, staleTime: number) => ({
    enabled:
      !disabled &&
      chainId === ChainId.Solana &&
      !input.disabled &&
      !isCrossChain &&
      enabled,
    staleTime,
    refetchInterval: disabled ? undefined : Math.max(staleTime, 5000),
  });

  const tokenTypeQuery = useSvmTokenTypeQuery(
    mode === 'buy' ? input.toAsset : input.fromAsset,
    {
      enabled: !isCrossChain && chainId === ChainId.Solana && !commonOnly,
      staleTime: 15 * 1000,
    },
  );
  const tokenType = !commonOnly
    ? loadDataFromQuery(tokenTypeQuery)
    : makeLoadable('jupiter');

  const dexesQuery = useSolanaDexes({
    staleTime: Infinity,
  });
  const dexes = loadDataFromQuery(dexesQuery);

  const jupiterEnabled = true;
  const parsedJupiterRoute = useJupiterRouteQuery(
    input,
    dexes.data ?? [],
    mode,
    solanaQueryOptions(jupiterEnabled, 1000),
  );

  const pumpEnabled = !commonOnly && tokenType.data === 'pumpfun';
  const parsedPumpFunRoute = usePumpFunRouteQuery(
    input,
    solanaQueryOptions(pumpEnabled, 1000),
  );

  const moonshotEnabled = !commonOnly && tokenType.data === 'moonshot';
  const parsedMoonshotRoute = useMoonshotRouteQuery(
    input,
    solanaQueryOptions(moonshotEnabled, 1000),
  );

  // Ethereum
  const { route: lifiRoute } = useLifiQuoteQuery(input, wallet, {
    enabled: !disabled && (isFromEthereum || isCrossChain) && !input.disabled,
    staleTime: 30 * 1000,
    refetchInterval: (query) =>
      query.isDisabled()
        ? undefined
        : Math.min(query.state.dataUpdateCount * 1000 * 30, 1000 * 60 * 5),
  });
  const parsedLifiRoute = mapLoadable(lifiRoute)((route) =>
    parseLifiQuote(route),
  );

  const parsedFourMemeRoute = useFourMemeRouteQuery(input, {
    enabled:
      !disabled &&
      !input.disabled &&
      chainId === ChainId.BinanceSmartChain &&
      !isCrossChain &&
      !commonOnly,
    staleTime: 15 * 1000,
    refetchInterval: disabled ? undefined : 1000 * 15,
  });

  const parsedRouterRoute = useRouterRouteQuery(input, {
    enabled: !disabled && isFromEthereum && !isCrossChain && !input.disabled,
    staleTime: 15 * 1000,
    refetchInterval: disabled ? undefined : 15 * 1000,
  });

  // TON
  const tonQueryOptions = (enabled: boolean) => ({
    enabled:
      !disabled &&
      chainId === ChainId.Ton &&
      !input.disabled &&
      !isCrossChain &&
      enabled,
    staleTime: 30 * 1000,
    refetchInterval: disabled ? undefined : 1000 * 30,
  });

  const parsedSwapCoffeeRoute = useSwapCoffeeRouteQuery(
    input,
    tonQueryOptions(true),
  );

  const gasPumpEnabled = !commonOnly;
  const parsedGasPumpRoute = useGasPumpRouteQuery(
    input,
    tonQueryOptions(gasPumpEnabled),
  );

  return useMemo(
    () =>
      onBlockchain(wallet.blockchain)(
        () => ({
          route: firstWith(
            chainId === ChainId.BinanceSmartChain &&
              !isCrossChain &&
              !commonOnly
              ? parsedFourMemeRoute
              : makeLoadableError(),
            altCondLoadable(parsedLifiRoute)(
              (data) => !data,
              // We use router as a backup because they currently do not return prices in the route data
              () => (isCrossChain ? makeLoadableError() : parsedRouterRoute),
            ),
          )((route) => !!route),
        }),
        () => ({
          route:
            isCrossChain && isToEthereum
              ? parsedLifiRoute
              : firstWith(
                  tokenType.loading
                    ? makeLoadableLoading()
                    : makeLoadableError(),
                  pumpEnabled
                    ? altCondLoadable(parsedPumpFunRoute)(
                        (data) => !data,
                        () => parsedJupiterRoute,
                      )
                    : makeLoadableError(),
                  moonshotEnabled
                    ? altCondLoadable(parsedMoonshotRoute)(
                        (data) => !data,
                        () => parsedJupiterRoute,
                      )
                    : makeLoadableError(),
                  jupiterEnabled ? parsedJupiterRoute : makeLoadableError(),
                )((route) => !!route),
        }),
        () => ({
          route:
            parsedGasPumpRoute.data && gasPumpEnabled
              ? parsedGasPumpRoute
              : parsedSwapCoffeeRoute,
        }),
      ),
    [
      ...spreadLoadable(lifiRoute),
      ...spreadLoadable(parsedJupiterRoute),
      ...spreadLoadable(parsedPumpFunRoute),
      ...spreadLoadable(parsedMoonshotRoute),
      ...spreadLoadable(parsedFourMemeRoute),
      ...spreadLoadable(parsedRouterRoute),
      ...spreadLoadable(parsedSwapCoffeeRoute),
      ...spreadLoadable(tokenType),
      isCrossChain,
      isFromEthereum,
      isToEthereum,
      chainId,
      commonOnly,
    ],
  );
}

function useTonSwappableTokensQuery(
  blockchain: IBlockchainType,
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
): Loadable<Record<number, ICryptoBalance[]>> {
  const stonFiSwappableTokens = useSwappableStonFiTokensQuery(cryptoBalances, {
    ...options,
    enabled: !!(options?.enabled && blockchain === IBlockchainType.Tvm),
  });
  const deDustSwappableTokens = useSwappableDeDustTokensQuery(cryptoBalances, {
    ...options,
    enabled: !!(options?.enabled && blockchain === IBlockchainType.Tvm),
  });
  return useMemo(() => {
    if (!stonFiSwappableTokens.success && !deDustSwappableTokens.success) {
      return firstWith<Record<number, ICryptoBalance[]>>(
        stonFiSwappableTokens,
        deDustSwappableTokens,
      )(() => true);
    }
    const result: Record<string, ICryptoBalance> = {};
    if (stonFiSwappableTokens.data) {
      stonFiSwappableTokens.data[ChainId.Ton]!.forEach(
        (item) => (result[item.address] = item),
      );
    }
    if (deDustSwappableTokens.data) {
      deDustSwappableTokens.data[ChainId.Ton]!.forEach((item) => {
        const existing = result[item.address];
        if (!existing || parseFloat(existing.tokenMetadata.price) === 0) {
          result[item.address] = item;
        }
      });
    }
    const chainInfo = getChainInfo(ChainId.Ton);
    const [owned, unowned] = partition(
      result,
      (token) => token.balance !== '0',
    );
    const [basic, other] = partition(
      unowned,
      (token) =>
        token.address === chainInfo.nativeCurrency.address ||
        chainInfo.stablecoins.some((coin) => coin.address === token.address),
    );
    return makeLoadable({
      [ChainId.Ton]: [
        ...owned.sort(
          (a, b) => parseFloat(b.balanceInUSD) - parseFloat(a.balanceInUSD),
        ),
        ...basic.sort((a, b) => {
          if (a.address === nativeTonAddress) {
            return 1;
          } else if (b.address === nativeTonAddress) {
            return 0;
          } else {
            return a.tokenMetadata.name.localeCompare(b.tokenMetadata.name);
          }
        }),
        ...other.sort((a, b) =>
          a.tokenMetadata.name.localeCompare(b.tokenMetadata.name),
        ),
      ],
    });
  }, [
    ...spreadLoadable(stonFiSwappableTokens),
    ...spreadLoadable(deDustSwappableTokens),
  ]);
}

export function useTokenPricesQuery(
  tokens: string[],
  chainId: number,
  options?: QueryOptions,
): { data: Loadable<JupiterTokenPriceResponse>; refetch: VoidPromiseFunction } {
  const wsolAddress = getChainInfo(ChainId.Solana).wrappedToken.address;
  const validTokens = uniq(
    tokens.map((token) =>
      chainId === ChainId.Solana && isNativeAddress(token)
        ? wsolAddress
        : token,
    ),
  ).sort();
  // TODO: add evm + ton + pump/moonshot
  const jupiterTokenPricesQuery = useJupiterTokenPricesQuery(
    validTokens,
    options,
  );
  const jupiterTokenPrices = loadDataFromQuery(
    jupiterTokenPricesQuery,
    (tokens) => {
      if (tokens[wsolAddress]) {
        return { ...tokens, [nativeSolAddress]: tokens[wsolAddress]! };
      }
      return tokens;
    },
  );
  return {
    data: jupiterTokenPrices,
    refetch: withDiscardedAsyncResult(jupiterTokenPricesQuery.refetch),
  };
}
