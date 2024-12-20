import { handleJSONResponse } from '../utils';
import { RugCheckResponse } from './types';

export async function getRugCheckReport(
  tokenAddress: string,
): Promise<RugCheckResponse> {
  const baseUrl = getRugCheckBaseUrl();
  const url = `${baseUrl}/v1/tokens/${tokenAddress}/report`;

  const resp = await fetch(url);
  return handleJSONResponse(resp);
}

export function getRugCheckBaseUrl() {
  return 'https://api.rugcheck.xyz';
}
