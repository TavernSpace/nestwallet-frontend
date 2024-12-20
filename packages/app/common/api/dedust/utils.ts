import { Address } from '@ton/core';
import { nativeTonAddress } from '../../../features/tvm/constants';
import { fetchCustomGraphql } from '../../hooks/graphql';
import { StonFiToken } from '../stonfi/types';
import { getStonFiToken } from '../stonfi/utils';
import { handleJSONResponse } from '../utils';
import {
  DeDustAssetsResponse,
  DeDustPrice,
  DeDustPricesResponse,
  DeDustRouteInput,
  DeDustRouteResponse,
  DeDustToken,
} from './types';

export async function getDeDustRoute(
  input: DeDustRouteInput,
): Promise<DeDustRouteResponse> {
  const url = 'https://api.dedust.io/v2/routing/plan';
  const parsed = { ...input };
  if (input.from === nativeTonAddress) {
    parsed.from = 'native';
  } else {
    parsed.from = `jetton:${Address.parse(input.from).toRawString()}`;
  }
  if (input.to === nativeTonAddress) {
    parsed.to = 'native';
  } else {
    parsed.to = `jetton:${Address.parse(input.to).toRawString()}`;
  }
  const routeReq = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed),
  });
  const priceReq =
    input.to === nativeTonAddress
      ? getStonFiToken(nativeTonAddress)
      : getDeDustPrices([{ address: input.to, decimals: input.toDecimals }]);
  const [routeRes, priceRes] = await Promise.all([routeReq, priceReq]);
  const route = await handleJSONResponse(routeRes);
  return {
    route,
    price:
      input.to === nativeTonAddress
        ? (priceRes as StonFiToken).dex_price_usd
        : (priceRes as DeDustPrice[]).find(
            (price) => price.address === input.to,
          )?.value,
  };
}

export async function getDeDustPrices(
  assets: { address: string; decimals: number }[],
): Promise<DeDustPrice[]> {
  if (assets.length === 0) {
    return [];
  }
  const query = `
    query GetPrices($assets: [PriceInput!]!) {
      prices(filter: {assets: $assets}) {
        address
        value
      }
    }`;
  const result: DeDustPricesResponse = await fetchCustomGraphql(
    'https://api.dedust.io/v3/graphql',
    query,
    { assets },
  );
  return result.data.prices;
}

export async function getDeDustTokens(): Promise<DeDustToken[]> {
  const query = `
    query GetAssets {
      assets {
        type
        address
        name
        symbol
        image
        decimals
        price
        aliased
      }
    }`;
  const result: DeDustAssetsResponse = await fetchCustomGraphql(
    'https://api.dedust.io/v3/graphql',
    query,
  );
  return result.data.assets.map((asset) =>
    !asset.address ? { ...asset, address: nativeTonAddress } : asset,
  );
}
