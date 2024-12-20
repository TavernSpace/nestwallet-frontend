import { handleJSONResponse } from '../utils';
import { StonFiRoute, StonFiRoutesInput, StonFiToken } from './types';

export async function getStonFiRoute(
  input: StonFiRoutesInput,
): Promise<StonFiRoute> {
  const url = 'https://api.ston.fi/v1/swap/simulate';
  const query = Object.keys(input)
    .map((key) => {
      const value = input[key as keyof StonFiRoutesInput]!;
      return value ? `${key}=${encodeURIComponent(value)}` : '';
    })
    .filter((item) => !!item)
    .join('&');
  const resp = await fetch(`${url}?${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleJSONResponse(resp);
}

export async function getStonFiTokens(): Promise<StonFiToken[]> {
  const url = 'https://rpc.ston.fi';
  const input = {
    jsonrpc: '2.0',
    id: 1,
    method: 'asset.list',
    params: {
      optimize_load: true,
      load_community: false,
    },
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const result = await handleJSONResponse(resp);
  const tokens: StonFiToken[] = result.result.assets;
  return tokens.filter((token) => !token.blacklisted);
}

export async function getStonFiToken(address: string): Promise<StonFiToken> {
  const url = `https://api.ston.fi/v1/assets/${address}`;
  const resp = await fetch(url);
  const result = await handleJSONResponse(resp);
  return result.asset;
}
