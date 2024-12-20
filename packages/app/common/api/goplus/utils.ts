import { handleWrappedJSONResponse } from '../utils';
import { EvmGoPlusResponse } from './types';

export async function getEvmGoPlusReport(
  chainId: string,
  tokenAddress: string,
): Promise<EvmGoPlusResponse> {
  const baseUrl = getGoPlusBaseUrl();
  const url = `${baseUrl}/${chainId}?contract_addresses=${tokenAddress}`;

  const resp = await fetch(url);
  return handleWrappedJSONResponse(resp);
}

export function getGoPlusBaseUrl() {
  return 'https://api.gopluslabs.io/api/v1/token_security';
}
