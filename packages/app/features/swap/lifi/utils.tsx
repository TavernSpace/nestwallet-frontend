import {
  QueryObserverOptions,
  UseQueryOptions,
  useQuery,
} from '@tanstack/react-query';
import base58 from 'bs58';
import { decodeBase64, ethers } from 'ethers';
import {
  LifiQuoteResponse,
  LifiRoute,
  LifiRoutesInput,
  LifiStep,
} from '../../../common/api/lifi/types';
import {
  getLifiQuote,
  getLifiRoutes,
  getLifiStepTransaction,
  getLifiTokens,
} from '../../../common/api/lifi/utils';
import { QueryOptions } from '../../../common/utils/query';
import {
  IBlockchainType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { useNestWallet } from '../../../provider/nestwallet';
import { ChainId, swapSupportedChainsForBlockchain } from '../../chain';
import { tokenApproval } from '../../crypto/approval';
import { UINT256_MAX } from '../../evm/constants';
import { getERC20ApprovalTransactionData } from '../../evm/contract/encode';
import { getMultiSendTransactionData } from '../../safe/encode';
import { createSafe } from '../../safe/utils';
import { nativeSolAddress } from '../../svm/constants';
import { ISwapAssetInput, SwapRoute, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

export function convertToLifiChainId(chainId: number): number {
  const lifiSolanaChainId = 1151111081099710;
  return chainId === ChainId.Solana ? lifiSolanaChainId : chainId;
}

export function normalizeLifiChainId(chainId: number): ChainId {
  const lifiSolanaChainId = 1151111081099710;
  return chainId === lifiSolanaChainId ? ChainId.Solana : chainId;
}

export function convertToLifiAddress(address: string): string {
  const lifiSolanaAddress = '11111111111111111111111111111111';
  return address === nativeSolAddress ? lifiSolanaAddress : address;
}

export function normalizeLifiAddress(address: string): string {
  const lifiSolanaAddress = '11111111111111111111111111111111';
  return address === lifiSolanaAddress ? nativeSolAddress : address;
}

export function parseLifiRoute(
  route: LifiRoute | null,
  fee: number,
): SwapRoute | null {
  if (!route) {
    return null;
  } else {
    return {
      data: { ...route },
      lifiRoute: route,
    };
  }
}

export function parseLifiQuote(quote: LifiQuoteResponse): SwapRoute | null {
  if (!quote) {
    return null;
  } else {
    return {
      data: {
        id: 'LiFi',
        fromChainId: quote.action.fromChainId,
        fromAmountUSD: (
          parseFloat(
            ethers.formatUnits(
              quote.action.fromAmount,
              quote.action.fromToken.decimals,
            ),
          ) * parseFloat(quote.action.fromToken.priceUSD)
        ).toString(),
        fromAmount: quote.action.fromAmount,
        fromToken: quote.action.fromToken,
        fromAddress: quote.action.fromAddress,
        toChainId: quote.action.toChainId,
        toAmountUSD: quote.estimate.toAmountUSD ?? '0',
        toAmountMin: quote.estimate.toAmountMin,
        toAmount: quote.estimate.toAmount,
        toToken: quote.action.toToken,
        toAddress: quote.action.toAddress,
      },
      lifiQuote: quote,
    };
  }
}

export function getLifiRouteInput(wallet: IWallet, input: ISwapAssetInput) {
  if (!isInputValid(input)) return;
  const lifiSolanaChainId = 1151111081099710;
  const lifiSolanaAddress = '11111111111111111111111111111111';
  const validFromChain =
    input.fromChainId === ChainId.Solana
      ? lifiSolanaChainId
      : input.fromChainId;
  const validToChain =
    input.toChainId === ChainId.Solana ? lifiSolanaChainId : input.toChainId;
  const validFromAddress =
    input.fromAsset?.address === nativeSolAddress
      ? lifiSolanaAddress
      : input.fromAsset?.address;
  const validToAddress =
    input.toAsset?.address === nativeSolAddress
      ? lifiSolanaAddress
      : input.toAsset?.address;
  return {
    fromAddress: wallet.address,
    fromAsset: validFromAddress!,
    fromChain: validFromChain!,
    toAddress: input.toAccount?.address!,
    toAsset: validToAddress!,
    toChain: validToChain!,
    fromAmount:
      input.amount && input.fromAsset?.tokenMetadata.decimals
        ? ethers
            .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
            .toString()
        : '0',
    slippage: input.slippage / 100,
    feePercent: input.fee / 10000,
  };
}

export function useLifiRoutesQuery(
  input: LifiRoutesInput | undefined,
  options?: Partial<QueryObserverOptions<LifiRoute[]>>,
) {
  const { apiClient } = useNestWallet();

  return useQuery({
    queryKey: ['lifiRoutesQuery', input],
    queryFn: async () => {
      const routes = await getLifiRoutes(apiClient, input!);
      return routes.routes.filter((route) => route.steps.length === 1);
    },
    ...options,
    enabled: options?.enabled && !!input,
  });
}

export function useLifiQuotesQuery(
  input: LifiRoutesInput | undefined,
  options?: Partial<QueryObserverOptions<LifiQuoteResponse>>,
) {
  const { apiClient } = useNestWallet();
  return useQuery({
    queryKey: ['lifiQuotesQuery', input],
    queryFn: async () => {
      return getLifiQuote(apiClient, input!);
    },
    ...options,
    enabled: options?.enabled && !!input,
  });
}

export function useLifiTokensQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['lifiTokensQuery'],
    queryFn: async () => {
      const tokens = await getLifiTokens({
        chains: swapSupportedChainsForBlockchain[IBlockchainType.Evm].map(
          (chain) => chain.id,
        ),
      });
      return tokens.tokens;
    },
    ...options,
  });
}

export async function getTransactionFromLifiRoute(
  wallet: IWallet,
  route: LifiRoute,
  infiniteApproval: boolean,
  computeUnitPrice?: bigint,
): Promise<SwapTransaction[]> {
  const txs: SwapTransaction[] = [];
  for (const step of route.steps) {
    const stepFromChainId = convertToLifiChainId(step.action.fromChainId);
    const stepToChainId = convertToLifiChainId(step.action.toChainId);
    const parsedStep: LifiStep = {
      ...step,
      action: {
        ...step.action,
        fromChainId: stepFromChainId,
        toChainId: stepToChainId,
        fromAddress: step.action.fromAddress
          ? convertToLifiAddress(step.action.fromAddress)
          : undefined,
        toAddress: step.action.toAddress
          ? convertToLifiAddress(step.action.toAddress)
          : undefined,
        fromToken: {
          ...step.action.fromToken,
          address: convertToLifiAddress(step.action.fromToken.address),
          chainId: stepFromChainId,
        },
        toToken: {
          ...step.action.toToken,
          address: convertToLifiAddress(step.action.toToken.address),
          chainId: stepToChainId,
        },
      },
    };
    const tx = await getLifiStepTransaction(parsedStep);
    if (!tx.transactionRequest) {
      throw new Error('Unable to create swap transaction');
    } else if (
      !tx.transactionRequest.to &&
      route.fromChainId !== ChainId.Solana
    ) {
      throw new Error('Unable to create swap transaction');
    }
    if (
      route.fromChainId !== ChainId.Solana &&
      route.fromChainId !== ChainId.Ton
    ) {
      const approvalAmount = await tokenApproval({
        address: wallet.address,
        chainId: step.action.fromChainId,
        tokenAddress: step.action.fromToken.address,
        approvalAddress: step.estimate.approvalAddress,
      });
      const hasApproval =
        BigInt(approvalAmount) >= BigInt(step.estimate.fromAmount);
      if (!hasApproval) {
        txs.push({
          type: 'approve',
          chainId: step.action.fromChainId,
          data: getERC20ApprovalTransactionData(
            step.action.fromToken.address,
            step.estimate.approvalAddress,
            infiniteApproval ? UINT256_MAX : step.estimate.fromAmount,
          ),
          approvalAddress: step.estimate.approvalAddress,
        });
      }
    }
    const type =
      step.action.toChainId === step.action.fromChainId ? 'swap' : 'bridge';
    const bridgeMetadata =
      type === 'bridge'
        ? {
            bridgeId: step.toolDetails.name,
            chainId: route.toChainId,
            expectedRecipientAddress: route.toAddress!,
            expectedTokenAddress: route.toToken.address,
            expectedTokenAmount: route.toAmount,
          }
        : undefined;
    if (route.fromChainId === ChainId.Solana) {
      txs.push({
        type,
        bridgeMetadata,
        chainId: step.action.fromChainId,
        data: {
          to: '',
          value: '0',
          data: base58.encode(decodeBase64(tx.transactionRequest.data)),
        },
      });
    } else {
      txs.push({
        type,
        bridgeMetadata,
        chainId: step.action.fromChainId,
        data: {
          to: tx.transactionRequest.to ?? '',
          value: tx.transactionRequest.value?.toString() || '0x00',
          data: tx.transactionRequest.data
            ? ethers.hexlify(tx.transactionRequest.data.toString())
            : '0x',
        },
      });
    }
  }
  return txs;
}

export async function getTransactionFromLifiQuote(
  wallet: IWallet,
  quote: NonNullable<LifiQuoteResponse>,
  infiniteApproval: boolean,
  computeUnitPrice?: bigint,
) {
  const txs: SwapTransaction[] = [];
  const type =
    quote.action.toChainId === quote.action.fromChainId ? 'swap' : 'bridge';
  const bridgeMetadata =
    type === 'bridge'
      ? {
          bridgeId: quote.toolDetails.name,
          chainId: quote.action.toChainId,
          expectedRecipientAddress: quote.action.toAddress!,
          expectedTokenAddress: quote.action.toToken.address,
          expectedTokenAmount: quote.estimate.toAmount,
        }
      : undefined;
  if (quote.action.fromChainId === ChainId.Solana) {
    txs.push({
      type,
      bridgeMetadata,
      chainId: quote.action.fromChainId,
      data: {
        to: '',
        value: '0',
        data: base58.encode(decodeBase64(quote.transactionRequest.data)),
      },
    });
  } else {
    const approvalAmount = await tokenApproval({
      address: wallet.address,
      chainId: quote.action.fromChainId,
      tokenAddress: quote.action.fromToken.address,
      approvalAddress: quote.estimate.approvalAddress,
    });
    const hasApproval =
      BigInt(approvalAmount) >= BigInt(quote.estimate.fromAmount);
    if (!hasApproval) {
      txs.push({
        type: 'approve',
        chainId: quote.action.fromChainId,
        data: getERC20ApprovalTransactionData(
          quote.action.fromToken.address,
          quote.estimate.approvalAddress,
          infiniteApproval ? UINT256_MAX : quote.estimate.fromAmount,
        ),
        approvalAddress: quote.estimate.approvalAddress,
      });
    }
    txs.push({
      type,
      bridgeMetadata,
      chainId: quote.action.fromChainId,
      data: {
        to: quote.transactionRequest.to ?? '',
        value: quote.transactionRequest.value?.toString() || '0x00',
        data: quote.transactionRequest.data
          ? ethers.hexlify(quote.transactionRequest.data.toString())
          : '0x',
      },
    });
  }
  return txs;
}

export async function createSafeSwapTransaction(
  wallet: IWallet,
  txs: SwapTransaction[],
) {
  const safe = await createSafe(wallet);
  const multiSendOnlyContract = await safe.getMultiSendAddress();
  const isMultiSend = txs.length > 1;
  const txData = isMultiSend
    ? getMultiSendTransactionData(
        txs.map((tx) => tx.data),
        multiSendOnlyContract,
      )
    : txs[0]!.data;
  return { ...txData, operation: isMultiSend ? 1 : 0 };
}

export function useLifiTransaction(
  props: {
    wallet: IWallet;
    route: LifiRoute;
    infiniteApproval: boolean;
  },
  options?: Omit<UseQueryOptions<SwapTransaction[]>, 'queryKey'>,
) {
  const { wallet, route, infiniteApproval } = props;
  return useQuery({
    queryKey: ['getLifiTransaction', { wallet, route, infiniteApproval }],
    queryFn: async () => {
      return getTransactionFromLifiRoute(wallet, route, infiniteApproval);
    },
    ...options,
  });
}
