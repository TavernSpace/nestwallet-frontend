import { handleJSONResponse } from '../utils';
import {
  SwapCoffeeRouteInput,
  SwapCoffeeRouteResponse,
  SwapCoffeeTransactionsInput,
  SwapCoffeeTransactionsResponse,
} from './types';

export async function getSwapCoffeeRoute(
  input: SwapCoffeeRouteInput,
): Promise<SwapCoffeeRouteResponse> {
  const baseUrl = getSwapCoffeeBaseUrl();
  const url = `${baseUrl}/v1/route`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleJSONResponse(resp);
}

export async function getSwapCoffeeTransactions(
  input: SwapCoffeeTransactionsInput,
): Promise<SwapCoffeeTransactionsResponse> {
  const baseUrl = getSwapCoffeeBaseUrl();
  const url = `${baseUrl}/v2/route/transactions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleJSONResponse(resp);
}

export function getSwapCoffeeBaseUrl() {
  return 'https://backend.swap.coffee';
}
