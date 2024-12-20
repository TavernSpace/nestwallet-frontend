import { ethers } from 'ethers';
import { ISwapAssetInput } from '../../../features/swap/types';
import {
  IBridgeStatus,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { NestWalletClient } from '../nestwallet/client';
import { handleJSONResponse } from '../utils';
import {
  LifiQuoteResponse,
  LifiRoutesInput,
  LifiRoutesResponse,
  LifiStatus,
  LifiStatusInput,
  LifiStatusResponse,
  LifiStepTransactionInput,
  LifiStepTransactionResponse,
  LifiSubStatus,
  LifiTokensInput,
  LifiTokensResponse,
} from './types';

export function lifiStatusToBridgeStatus(
  status: LifiStatus,
  subStatus?: LifiSubStatus,
) {
  const doneStatus = (subStatus?: LifiSubStatus): IBridgeStatus => {
    return subStatus === 'PARTIAL'
      ? IBridgeStatus.Partial
      : subStatus === 'REFUNDED'
      ? IBridgeStatus.Refunded
      : IBridgeStatus.Complete;
  };
  const pendingStatus = (subStatus?: LifiSubStatus): IBridgeStatus => {
    return subStatus === 'WAIT_DESTINATION_TRANSACTION'
      ? IBridgeStatus.WaitDestinationConfirm
      : subStatus === 'WAIT_SOURCE_CONFIRMATIONS'
      ? IBridgeStatus.WaitSourceConfirm
      : subStatus === 'REFUND_IN_PROGRESS'
      ? IBridgeStatus.Refunding
      : IBridgeStatus.NotInitiated;
  };
  // TODO: need to handle tx not found by lifi
  return status === 'DONE'
    ? doneStatus(subStatus)
    : status === 'PENDING'
    ? pendingStatus(subStatus)
    : status === 'FAILED'
    ? IBridgeStatus.Failed
    : IBridgeStatus.NotInitiated;
}

export async function getLifiStatus(
  input: LifiStatusInput,
): Promise<LifiStatusResponse> {
  const baseUrl = getLifiBaseUrl();
  const params = new URLSearchParams({
    txHash: input.txHash,
    fromChain: input.fromChain.toString(),
    toChain: input.toChain.toString(),
  });
  const url = `${baseUrl}/v1/status?${params.toString()}`;
  const resp = await fetch(url, { cache: 'no-store' });
  return handleJSONResponse(resp);
}

export async function getLifiTokens(
  input: LifiTokensInput,
): Promise<LifiTokensResponse> {
  const baseUrl = getLifiBaseUrl();
  const params = new URLSearchParams({
    chains: input.chains.join(','),
  });
  const url = `${baseUrl}/v1/tokens?${params.toString()}`;
  const resp = await fetch(url);
  return handleJSONResponse(resp);
}

export async function getLifiQuote(
  apiClient: NestWalletClient,
  input: LifiRoutesInput,
): Promise<LifiQuoteResponse> {
  const baseUrl = getLifiBaseUrl();
  const url = `${baseUrl}/v1/quote`;
  const lifiSolanaChainId = 1151111081099710;
  const isSolana = input.fromChain === lifiSolanaChainId;
  const ignoreFee = isSolana || input.feePercent === 0;
  const payload = {
    fromChain: input.fromChain,
    toChain: input.toChain,
    fromToken: input.fromAsset,
    toToken: input.toAsset,
    fromAddress: input.fromAddress,
    toAddress: input.toAddress,
    fromAmount: input.fromAmount,

    order: 'CHEAPEST',
    slippage: input.slippage,
    integrator: ignoreFee ? undefined : 'nestwallet',
    fee: ignoreFee ? undefined : input.feePercent,
    referrer: ignoreFee
      ? undefined
      : '0xB4b0De9b2f90e74FB606BE0c5b87008A0fDc398A',
    allowDestinationCall: false,
    fromAmountForGas: 0,
    maxPriceImpact: 0.9,
    skipSimulation: true,
  };
  const denyExchanges = ['openocean', 'dodo'];
  const query = Object.keys(payload)
    .map((key) => {
      const value = payload[key as keyof typeof payload];
      return value ? `${key}=${value}` : undefined;
    })
    .filter((q): q is string => !!q)
    .concat(...denyExchanges.map((ex) => `denyExchanges=${ex}`))
    .join('&');

  const resp = await fetch(`${url}?${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // if user is rate limited we make call for them in the backend
  if (resp.status === 429) {
    return apiClient.getLifiQuote(query);
  } else if (resp.status === 404) {
    return null;
  }
  return handleJSONResponse(resp);
}

export async function getLifiRoutes(
  apiClient: NestWalletClient,
  input: LifiRoutesInput,
): Promise<LifiRoutesResponse> {
  const baseUrl = getLifiBaseUrl();
  const url = `${baseUrl}/v1/advanced/routes`;
  const lifiSolanaChainId = 1151111081099710;
  const isSolana = input.fromChain === lifiSolanaChainId;
  const ignoreFee = isSolana || input.feePercent === 0;
  const payload = {
    fromChainId: input.fromChain,
    fromTokenAddress: input.fromAsset,
    fromAddress: input.fromAddress,
    fromAmount: input.fromAmount,
    toChainId: input.toChain,
    toTokenAddress: input.toAsset,
    toAddress: input.toAddress,
    options: {
      order: 'RECOMMENDED',
      slippage: input.slippage,
      allowSwitchChain: false,
      integrator: ignoreFee ? undefined : 'nestwallet',
      maxPriceImpact: 0.9,
      fee: ignoreFee ? undefined : input.feePercent,
      referrer: ignoreFee
        ? undefined
        : '0xB4b0De9b2f90e74FB606BE0c5b87008A0fDc398A',
      exchanges: {
        deny: ['openocean', 'dodo'],
      },
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // if user is rate limited we make call for them in the backend
  if (resp.status === 429) {
    const routeResponse = await apiClient.getLifiRoute(payload);
    if (!routeResponse.routes) {
      throw new Error('Route not found');
    }
    return { routes: [routeResponse.routes] };
  }

  return handleJSONResponse(resp);
}

export function getLifiRouteInput(
  wallet: IWallet,
  input: ISwapAssetInput,
  slippage: number,
) {
  const isValid =
    input.amount !== '' &&
    !!input.toAccount &&
    parseFloat(input.amount) !== 0 &&
    !!input.fromAsset &&
    !!input.toAsset &&
    (input.fromAsset.address !== input.toAsset.address ||
      input.fromAsset.chainId !== input.toAsset.chainId);
  if (!isValid) {
    return;
  }
  return {
    fromAddress: wallet.address,
    fromAsset: input.fromAsset?.address!,
    fromChain: input.fromAsset?.chainId!,
    toAddress: input.toAccount?.address!,
    toAsset: input.toAsset?.address!,
    toChain: input.toAsset?.chainId!,
    fromAmount:
      input.amount && input.fromAsset?.tokenMetadata.decimals
        ? ethers
            .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
            .toString()
        : '0',
    slippage: slippage / 100,
  };
}

export async function getLifiStepTransaction(
  input: LifiStepTransactionInput,
): Promise<LifiStepTransactionResponse> {
  const baseUrl = getLifiBaseUrl();
  const url = `${baseUrl}/v1/advanced/stepTransaction`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleJSONResponse(resp);
}

export function getLifiBaseUrl() {
  return 'https://li.quest';
}
