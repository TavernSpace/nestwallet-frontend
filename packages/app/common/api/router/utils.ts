import { handleJSONResponse } from '../utils';
import {
  RouterQuoteInput,
  RouterQuoteResponse,
  RouterTransactionInput,
  RouterTransactionResponse,
} from './types';

const partnerId = '245';

export async function getRouterRoute(
  input: RouterQuoteInput,
): Promise<RouterQuoteResponse> {
  const baseUrl = getRouterBaseUrl();
  const queryParams = new URLSearchParams({
    ...input,
    partnerId,
  });
  const url = `${baseUrl}/api/v2/quote?${queryParams}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleJSONResponse(resp);
}

export async function getRouterTransaction(
  input: RouterTransactionInput,
): Promise<RouterTransactionResponse> {
  const baseUrl = getRouterBaseUrl();
  const url = `${baseUrl}/api/v2/transaction`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleJSONResponse(resp);
}

export function getRouterBaseUrl() {
  return 'https://api-beta.pathfinder.routerprotocol.com';
}
