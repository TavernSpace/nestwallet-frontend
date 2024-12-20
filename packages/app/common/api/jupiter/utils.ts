import _ from 'lodash';
import { ChainId, getChainInfo } from '../../../features/chain';
import { nativeSolAddress } from '../../../features/svm/constants';
import { mapObject } from '../../utils/functions';
import { NestWalletClient } from '../nestwallet/client';
import { handleJSONResponse } from '../utils';
import {
  JupiterQuoteInput,
  JupiterQuoteResponse,
  JupiterSwapInput,
  JupiterSwapResponse,
  JupiterTokenDetailsResponse,
  JupiterTokenPriceResponse,
  JupiterTokenPriceResponseV2,
  JupiterTokensResponse,
} from './types';

async function getTokenDetails(): Promise<JupiterTokenDetailsResponse> {
  const tokenDetailsUrl =
    'https://tokens.jup.ag/tokens?tags=verified,birdeye-trending';
  const tokenDetails = await fetch(tokenDetailsUrl);
  return handleJSONResponse(tokenDetails);
}

export async function getTokenPrices(
  tokens: string[],
): Promise<JupiterTokenPriceResponse> {
  if (tokens.length === 0) {
    return {};
  }
  const priceUrl = 'https://api.jup.ag/price/v2';
  const splits = _.chunk(tokens, 100);

  const responses = await Promise.all(
    splits.map(async (split) => {
      const data = split.join(',');
      const url = `${priceUrl}?ids=${data}`;
      const resp = await fetch(url);
      return handleJSONResponse(resp);
    }),
  );
  const joined: JupiterTokenPriceResponseV2 = responses.reduce((acc, resp) => {
    return { ...acc, ...resp.data };
  }, {});
  return mapObject(joined, (value) => ({
    ...value,
    price: value ? parseFloat(value.price) : 0,
  }));
}

export async function getJupiterTokens(): Promise<JupiterTokensResponse> {
  const tokenDetails = await getTokenDetails();
  const tokens = tokenDetails.map((token) => ({
    chainId: ChainId.Solana,
    address: token.address,
    symbol: token.symbol,
    decimals: token.decimals,
    name: token.name,
    logoURI: token.logoURI ?? '',
    priceUSD: '',
  }));
  const wsol = tokens.find(
    (token) =>
      token.address === getChainInfo(ChainId.Solana).wrappedToken.address,
  );
  if (wsol) {
    tokens.unshift({
      ...wsol,
      address: nativeSolAddress,
    });
  }
  return tokens;
}

export async function getJupiterRoute(
  apiClient: NestWalletClient,
  input: JupiterQuoteInput,
): Promise<JupiterQuoteResponse> {
  // Get quote with wSol instead of Sol
  const solana = getChainInfo(ChainId.Solana);
  const wrapAndUnwrapSol = !(
    input.inputMint === solana.wrappedToken.address ||
    input.outputMint === solana.wrappedToken.address
  );
  input.inputMint =
    input.inputMint === nativeSolAddress
      ? getChainInfo(ChainId.Solana).wrappedToken.address
      : input.inputMint;
  input.outputMint =
    input.outputMint === nativeSolAddress
      ? getChainInfo(ChainId.Solana).wrappedToken.address
      : input.outputMint;

  const prices = await getTokenPrices([input.inputMint, input.outputMint]);
  const inputPriceUSD = prices[input.inputMint]!.price.toString();
  const outputPriceUSD = prices[input.outputMint]!.price.toString();

  const queryParams = new URLSearchParams({
    inputMint: input.inputMint,
    outputMint: input.outputMint,
    amount: input.amount,
    slippageBps: input.slippageBps.toString(),
    minimizeSlippage: 'false',
    onlyDirectRoutes: 'false',
    restrictIntermediateTokens: 'true',
    swapMode: 'ExactIn',
    asLegacyTransaction: 'false',
    maxAccounts: '64',
    dexes: input.dexes.join(','),
  }).toString();
  try {
    const backendResp = await apiClient.getSolanaRoute(queryParams);
    return {
      ...backendResp,
      inputPriceUSD,
      outputPriceUSD,
      wrapAndUnwrapSol,
    };
  } catch {
    const baseUrl = getJupiterBaseUrl();
    const url = `${baseUrl}/v6/quote?${queryParams}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const jsonResponse = await handleJSONResponse(resp);
    if (!jsonResponse) {
      throw new Error('No route found');
    }
    return {
      ...jsonResponse,
      inputPriceUSD,
      outputPriceUSD,
      wrapAndUnwrapSol,
    };
  }
}

export async function getJupiterTransaction(
  apiClient: NestWalletClient,
  input: JupiterSwapInput,
): Promise<JupiterSwapResponse> {
  const body: JupiterSwapInput = {
    quoteResponse: input.quoteResponse,
    userPublicKey: input.userPublicKey,
    dynamicComputeUnitLimit: true,
    computeUnitPriceMicroLamports: 2_000_000,
    wrapAndUnwrapSol: input.quoteResponse.wrapAndUnwrapSol,
  };
  try {
    const result = await apiClient.getSolanaTransaction(body);
    return result;
  } catch {
    const baseUrl = getJupiterBaseUrl();
    const url = `${baseUrl}/v6/swap`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return handleJSONResponse(resp);
  }
}

export function getJupiterBaseUrl() {
  return 'https://quote-api.jup.ag';
}
