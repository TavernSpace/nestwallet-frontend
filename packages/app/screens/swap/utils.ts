import { toNano } from '@ton/core';
import { ethers } from 'ethers';
import { zip } from 'lodash';
import { useMemo } from 'react';
import { NestWalletClient } from '../../common/api/nestwallet/client';
import { useMutationEmitter } from '../../common/hooks/query';
import { BasicFeeData, Loadable } from '../../common/types';
import {
  loadDataFromQuery,
  makeLoadable,
  mapLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { ChainId, getChainInfo } from '../../features/chain';
import { isNativeAddress } from '../../features/crypto/utils';
import {
  lifiAddress,
  nullAddress,
  UINT256_MAX,
} from '../../features/evm/constants';
import { getJSONRPCProvider } from '../../features/evm/provider';
import { getTotalFees } from '../../features/proposal/fee';
import {
  getTransactionOptions,
  parseFeeData,
} from '../../features/proposal/gas';
import { GasPriceLevel } from '../../features/proposal/types';
import { useComputeUnitPriceQuery } from '../../features/svm/transaction/compute';
import { getTransactionFromDeDustRoute } from '../../features/swap/dedust/utils';
import { getTransactionFromFourMemeRoute } from '../../features/swap/fourmeme/utils';
import { getTransactionFromGasPumpRoute } from '../../features/swap/gaspump/utils';
import { getTransactionFromJupiterRoute } from '../../features/swap/jupiter/utils';
import {
  createSafeSwapTransaction,
  getTransactionFromLifiQuote,
  getTransactionFromLifiRoute,
} from '../../features/swap/lifi/utils';
import { getTransactionFromMoonshotRoute } from '../../features/swap/moonshot/utils';
import { getTransactionFromPumpFunRoute } from '../../features/swap/pump-fun/utils';
import { getTransactionFromRouterRoute } from '../../features/swap/router/utils';
import { getTransactionFromStonFiRoute } from '../../features/swap/stonfi/utils';
import { getTransactionFromSwapCoffeeRoute } from '../../features/swap/swap-coffee/utils';
import {
  BridgeMetadata,
  ISwapAssetInput,
  SwapRoute,
  SwapTransaction,
} from '../../features/swap/types';
import { getDefaultSwapGasLimit, getFeeData } from '../../features/swap/utils';
import {
  ICreateSafeTransactionProposalInput,
  ICryptoBalance,
  IFeeData,
  IGasLevel,
  ISwapPlatform,
  ISwapType,
  ITransactionBridgeMetadata,
  ITransactionMetadataInput,
  ITransactionMetaType,
  ITransactionProposal,
  ITransactionProposalType,
  ITransactionSwapMetadata,
  ITransactionTokenApprovalMetadata,
  ITxType,
  IWallet,
  useCreateTransactionProposalMutation,
  useFeeDataQuery,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';
import { customGasLevel } from '../../molecules/gas/utils';
import { CustomGasLevelMap } from '../quick-trade/types';
import { defaultCommonBalance } from '../quick-trade/utils';

export function useCreateSwapProposalMutation(wallet: IWallet) {
  const createTransactionProposalMutation = useMutationEmitter(
    [
      graphqlType.PendingTransaction,
      graphqlType.Proposal,
      graphqlType.Notification,
    ],
    useCreateTransactionProposalMutation(),
  );

  const createSafeSwapProposal = async (
    value: ISwapAssetInput,
    route: SwapRoute,
    swapType: ISwapType,
  ) => {
    const txs = route.lifiQuote
      ? await getTransactionFromLifiQuote(
          wallet,
          route.lifiQuote,
          value.infiniteApproval,
        )
      : route.lifiRoute
      ? await getTransactionFromLifiRoute(
          wallet,
          route.lifiRoute,
          value.infiniteApproval,
        )
      : undefined;
    if (!txs || txs.length === 0) {
      throw new Error('Invalid route, unable to create Safe transaction');
    }
    const txData = await createSafeSwapTransaction(wallet, txs);
    const metadata: ITransactionMetadataInput[] = [];
    if (txs.length > 1) {
      metadata.push({
        type: ITransactionMetaType.TokenApproval,
        data: getApprovalMetadataFromRoute(route, value),
      });
    }
    metadata.push({
      type: ITransactionMetaType.Swap,
      data: getSwapMetadataFromRoute(route, value, swapType),
    });
    const safeInput: ICreateSafeTransactionProposalInput = {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: value.description,
      data: txData.data,
      toAddress: txData.to,
      value: txData.value,
      relay: value.relay,
      operation: txData.operation,
    };
    const result = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.Safe,
        safe: safeInput,
        metadata,
      },
    });
    return result.createTransactionProposal as ITransactionProposal;
  };

  const mutate = async (
    value: ISwapAssetInput,
    route: SwapRoute,
    swapType: ISwapType,
  ) => {
    return createSafeSwapProposal(value, route, swapType);
  };

  return { mutate };
}

export function computeSwapRate(route: SwapRoute) {
  return (
    parseFloat(
      ethers.formatUnits(route.data.toAmount, route.data.toToken.decimals),
    ) /
    parseFloat(
      ethers.formatUnits(route.data.fromAmount, route.data.fromToken.decimals),
    )
  );
}

export async function computeEVMSwapTransactionOptions(
  apiClient: NestWalletClient,
  wallet: IWallet,
  balances: ICryptoBalance[],
  chainId: number,
  txs: SwapTransaction[],
  customGas?: GasPriceLevel,
) {
  const transactions = txs.map((tx) => ({
    from: wallet.address,
    chainId,
    to: tx.data.to,
    value: tx.data.value.toString() || '0x0',
    data: tx.data.data,
  }));
  const provider = getJSONRPCProvider(chainId);
  const feeDataPromise = getFeeData(
    apiClient,
    txs.map((tx) => ({
      chainId: tx.chainId,
      data: tx.data.data,
      txType: tx.type === 'approve' ? ITxType.ApproveToken : ITxType.Swap,
    })),
  );
  // TODO: currently we want to approve + send in one click. Since the token might not be approved, estimate gas fails on the token.
  // So, for swaps we set a default gas limit of 800000 since this is sufficient for almost all LiFi txs. Note that there are only multiple
  // txs if one is an approval
  // NOTE: we half the gas limit amounts since our signer automatically doubles them
  const gasLimitsPromise = Promise.all(
    transactions.map(async (tx, index) =>
      index === 0
        ? provider.estimateGas({
            to: tx.to,
            from: wallet.address,
            value: tx.value,
            data: tx.data,
          })
        : getDefaultSwapGasLimit(chainId),
    ),
  );
  const [fees, gasLimits, nonce] = await Promise.all([
    feeDataPromise,
    gasLimitsPromise,
    provider.getTransactionCount(wallet.address, 'pending'),
  ]);
  // TODO: for now always use fast
  const gasLevels = fees.map(
    (fee) => parseFeeData(fee)[chainId === ChainId.Ethereum ? 1 : 2],
  );
  const gasData = zip(gasLevels, gasLimits, fees);
  const totalFee = gasData.reduce(
    (acc, [level, limit, fee]) =>
      acc +
      getTotalFees({
        feeData: fee!,
        gasLimit: fee!.staticGasLimit
          ? BigInt(Math.max(Number(limit! * 2n), fee!.staticGasLimit))
          : limit! * 2n,
        selectedGasLevel: customGas ?? level!,
      }).totalFeeBig,
    BigInt(0),
  );
  const currentBalance = BigInt(
    balances.find(
      (crypto) => crypto.address === nullAddress && crypto.chainId === chainId,
    )?.balance || '0',
  );
  if (currentBalance < totalFee) {
    throw new Error('insufficient gas for transaction');
  }
  return gasData.map(([level, limit, fee], index) =>
    getTransactionOptions(
      fee!.staticGasLimit ? BigInt(fee!.staticGasLimit) / 2n : limit!,
      customGas ?? level!,
      nonce + index,
    ),
  );
}

export async function getSwapTransactionFromRoute(
  apiClient: NestWalletClient,
  route: SwapRoute,
  wallet: IWallet,
  input: ISwapAssetInput,
  customGas?: GasPriceLevel,
) {
  if (route.jupiter) {
    return getTransactionFromJupiterRoute(
      apiClient,
      wallet,
      route.jupiter,
      customGas?.estimatedGasPrice,
    );
  } else if (route.lifiRoute) {
    return getTransactionFromLifiRoute(
      wallet,
      route.lifiRoute,
      input.infiniteApproval,
      customGas?.estimatedGasPrice,
    );
  } else if (route.lifiQuote) {
    return getTransactionFromLifiQuote(
      wallet,
      route.lifiQuote,
      input.infiniteApproval,
      customGas?.estimatedGasPrice,
    );
  } else if (route.pumpfun) {
    return getTransactionFromPumpFunRoute(
      wallet,
      route.pumpfun,
      customGas?.estimatedGasPrice,
    );
  } else if (route.moonshot) {
    return getTransactionFromMoonshotRoute(
      wallet,
      route.moonshot,
      customGas?.estimatedGasPrice,
    );
  } else if (route.stonfi) {
    return getTransactionFromStonFiRoute(wallet, route.stonfi);
  } else if (route.dedust) {
    return getTransactionFromDeDustRoute(wallet, input, route.dedust);
  } else if (route.gasPump) {
    return getTransactionFromGasPumpRoute(wallet, route.gasPump);
  } else if (route.fourMeme) {
    return getTransactionFromFourMemeRoute(
      wallet,
      route.data.toAmountMin,
      route.fourMeme,
    );
  } else if (route.router) {
    return getTransactionFromRouterRoute(wallet, route.router);
  } else if (route.swapCoffee) {
    return getTransactionFromSwapCoffeeRoute(
      wallet,
      route.swapCoffee,
      input.slippage,
    );
  } else {
    return [];
  }
}

export function getSwapPlatformFromRoute(route: SwapRoute) {
  return route.lifiRoute || route.lifiQuote
    ? ISwapPlatform.Lifi
    : route.jupiter
    ? ISwapPlatform.Jupiter
    : route.pumpfun
    ? ISwapPlatform.Pumpfun
    : route.moonshot
    ? ISwapPlatform.Moonshot
    : route.stonfi
    ? ISwapPlatform.Stonfi
    : route.dedust
    ? ISwapPlatform.Dedust
    : route.gasPump
    ? ISwapPlatform.Gaspump
    : route.fourMeme
    ? ISwapPlatform.Fourmeme
    : route.router
    ? ISwapPlatform.Router
    : route.swapCoffee
    ? ISwapPlatform.Swapcoffee
    : null;
}

export function getApprovalMetadataFromRoute(
  route: SwapRoute,
  input: ISwapAssetInput,
): ITransactionTokenApprovalMetadata {
  return {
    chainId: route.data.fromChainId,
    tokenAddress: route.data.fromToken.address,
    amount: input.infiniteApproval ? UINT256_MAX : route.data.fromAmount,
    tokenMetadata: {
      id: route.data.fromToken.address,
      address: route.data.fromToken.address,
      name: input.fromAsset?.tokenMetadata.name || route.data.fromToken.name,
      symbol:
        input.fromAsset?.tokenMetadata.symbol || route.data.fromToken.symbol,
      imageUrl:
        input.fromAsset?.tokenMetadata.imageUrl ||
        route.data.fromToken.logoURI ||
        '',
      decimals: route.data.fromToken.decimals,
      isNativeToken: isNativeAddress(route.data.fromToken.address),
      price: route.data.fromToken.priceUSD || '0',
    },
    approvalAddress: lifiAddress,
  };
}

export function getSwapMetadataFromRoute(
  route: SwapRoute,
  input: ISwapAssetInput,
  swapType: ISwapType,
): ITransactionSwapMetadata {
  const platform = getSwapPlatformFromRoute(route);
  if (!platform) {
    throw new Error('could not determine route');
  }
  return {
    platform,
    chainId: route.data.fromChainId,
    swapType,
    inTokenAddress: route.data.fromToken.address,
    inTokenAmount: route.data.fromAmount,
    inTokenMetadata: {
      id: route.data.fromToken.address,
      address: route.data.fromToken.address,
      name: input.fromAsset?.tokenMetadata.name || route.data.fromToken.name,
      symbol:
        input.fromAsset?.tokenMetadata.symbol || route.data.fromToken.symbol,
      imageUrl:
        input.fromAsset?.tokenMetadata.imageUrl ||
        route.data.fromToken.logoURI ||
        '',
      decimals: route.data.fromToken.decimals,
      isNativeToken: isNativeAddress(route.data.fromToken.address),
      price: route.data.fromToken.priceUSD || '0',
    },
    outTokenAddress: route.data.toToken.address,
    outTokenAmount: route.data.toAmount,
    outTokenMetadata: {
      id: route.data.toToken.address,
      address: route.data.toToken.address,
      name: input.toAsset?.tokenMetadata.name || route.data.toToken.name,
      symbol: input.toAsset?.tokenMetadata.symbol || route.data.toToken.symbol,
      imageUrl:
        input.toAsset?.tokenMetadata.imageUrl ||
        route.data.toToken.logoURI ||
        '',
      decimals: route.data.toToken.decimals,
      isNativeToken: isNativeAddress(route.data.toToken.address),
      price: route.data.toToken.priceUSD || '0',
    },
    expectedSwapPriceUsd:
      swapType === ISwapType.Sell
        ? route.data.toAmountUSD
        : route.data.fromAmountUSD,
  };
}

export function getBridgeMetadataFromRoute(
  route: SwapRoute,
  input: ISwapAssetInput,
  bridgeMetadata: BridgeMetadata,
): ITransactionBridgeMetadata {
  return {
    bridgeId: bridgeMetadata.bridgeId,
    fromChainId: route.data.fromChainId,
    toChainId: route.data.toChainId,
    inTokenAddress: route.data.fromToken.address,
    inTokenAmount: route.data.fromAmount,
    inTokenMetadata: {
      id: route.data.fromToken.address,
      address: route.data.fromToken.address,
      name: input.fromAsset?.tokenMetadata.name || route.data.fromToken.name,
      symbol:
        input.fromAsset?.tokenMetadata.symbol || route.data.fromToken.symbol,
      imageUrl:
        input.fromAsset?.tokenMetadata.imageUrl ||
        route.data.fromToken.logoURI ||
        '',
      decimals: route.data.fromToken.decimals,
      isNativeToken: isNativeAddress(route.data.fromToken.address),
      price: route.data.fromToken.priceUSD || '0',
    },
    outTokenAddress: route.data.toToken.address,
    outTokenAmount: route.data.toAmount,
    outTokenMetadata: {
      id: route.data.toToken.address,
      address: route.data.toToken.address,
      name: input.toAsset?.tokenMetadata.name || route.data.toToken.name,
      symbol: input.toAsset?.tokenMetadata.symbol || route.data.toToken.symbol,
      imageUrl:
        input.toAsset?.tokenMetadata.imageUrl ||
        route.data.toToken.logoURI ||
        '',
      decimals: route.data.toToken.decimals,
      isNativeToken: isNativeAddress(route.data.toToken.address),
      price: route.data.toToken.priceUSD || '0',
    },
    recipientAddress: bridgeMetadata.expectedRecipientAddress,
  };
}

export function swapAssetPositions(input: ISwapAssetInput) {
  const oldFromAsset = input.fromAsset;
  const oldToAsset = input.toAsset;
  return {
    ...input,
    fromChainId: input.toChainId,
    toChainId: input.fromChainId,
    fromAsset: oldToAsset,
    toAsset: oldFromAsset,
    amount: '',
  };
}

export function sufficientFundError(
  chainId: number,
  assets: ICryptoBalance[],
  amount: bigint,
  gasAmount: bigint,
) {
  const nativeToken = assets.find(
    (asset) => asset.tokenMetadata.isNativeToken && chainId === asset.chainId,
  );
  const error = `Insufficient ${
    getChainInfo(chainId).nativeCurrency.symbol
  } for network fees`;
  const totalAmount =
    chainId === ChainId.Solana
      ? amount * 1_000_000n + gasAmount
      : amount + gasAmount;
  if (nativeToken) {
    return chainId === ChainId.Solana
      ? BigInt(nativeToken.balance) * 1_000_000n >= totalAmount
        ? undefined
        : error
      : BigInt(nativeToken.balance) >= totalAmount
      ? undefined
      : error;
  } else {
    return error;
  }
}

export function useSwapGasLevel(
  chainId: number,
  toChainId: number,
  customGasMap: CustomGasLevelMap,
  type: 'limit' | 'market',
  nativeAsset?: ICryptoBalance,
) {
  const computeUnitPriceQuery = useComputeUnitPriceQuery(
    ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'],
    20_000_000,
    95,
    {
      enabled: chainId === ChainId.Solana,
      refetchInterval: 1000 * 15,
      staleTime: 1000 * 15,
    },
  );
  const computeUnitPrice = loadDataFromQuery(computeUnitPriceQuery);

  const feeDataQuery = useFeeDataQuery(
    { input: { chainId } },
    {
      enabled: chainId !== ChainId.Solana && chainId !== ChainId.Ton,
      refetchInterval: 1000 * 15,
      staleTime: 1000 * 15,
    },
  );
  const feeData = loadDataFromQuery(
    feeDataQuery,
    (data) => data.feeData as IFeeData,
  );

  const parsedFeeData: Loadable<IFeeData | BasicFeeData> = useMemo(
    () =>
      chainId === ChainId.Solana
        ? mapLoadable(computeUnitPrice)((price) => ({
            // Lifi does not support changing gas for solana currently
            units:
              toChainId === ChainId.Solana
                ? [
                    BigInt(Math.floor(price * 0.8)),
                    BigInt(Math.floor(price)),
                    BigInt(Math.floor(price * 1.2)),
                  ]
                : [250_000n, 250_000n, 250_000n],
            token:
              nativeAsset?.tokenMetadata ??
              defaultCommonBalance(
                getChainInfo(ChainId.Solana).nativeCurrency,
                ChainId.Solana,
              ).tokenMetadata,
            additionalDecimals: 6,
          }))
        : chainId === ChainId.Ton
        ? makeLoadable({
            units: [toNano(0.3), toNano(0.3), toNano(0.3)],
            token:
              nativeAsset?.tokenMetadata ??
              defaultCommonBalance(
                getChainInfo(ChainId.Ton).nativeCurrency,
                ChainId.Ton,
              ).tokenMetadata,
            additionalDecimals: 0,
          })
        : feeData,
    [
      ...spreadLoadable(computeUnitPrice),
      ...spreadLoadable(feeData),
      chainId,
      toChainId,
      nativeAsset,
    ],
  );

  const gasLimit: Loadable<bigint> = useMemo(
    () =>
      chainId === ChainId.Solana
        ? makeLoadable(type === 'limit' ? 10_000n : 300_000n)
        : chainId === ChainId.Ton
        ? makeLoadable(1n)
        : chainId === ChainId.Ethereum
        ? makeLoadable(200_000n)
        : makeLoadable(400_000n),
    [chainId, type],
  );

  const defaultGas = useMemo(
    () =>
      customGasMap[chainId]?.level?.level === IGasLevel.Custom
        ? makeLoadable(
            customGasLevel(
              customGasMap[chainId]!.level!.estimatedGasPrice,
              chainId,
              0n,
            ),
          )
        : undefined,
    [customGasMap, chainId],
  );

  return {
    parsedFeeData,
    gasLimit,
    defaultGas,
  };
}
