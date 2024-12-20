export interface DeDustRouteInput {
  from: string;
  fromDecimals: number;
  to: string;
  toDecimals: number;
  amount: string;
}

type DeDustRouteStep = {
  pool: {
    address: string;
    isStable: boolean;
    assets: [string, string];
    reserves: [string, string];
  };
  assetIn: string;
  assetOut: string;
  tradeFee: string;
  amountIn: string;
  amountOut: string;
};

export type DeDustRoute = DeDustRouteStep[];

export type DeDustRouteResponse = {
  route: [DeDustRoute] | [];
  price?: string;
};

export interface DeDustAssetsResponse {
  data: {
    assets: DeDustToken[];
  };
}

export interface DeDustPricesResponse {
  data: {
    prices: DeDustPrice[];
  };
}

export interface DeDustToken {
  type: string;
  address: string | null;
  name: string;
  symbol: string;
  image: string;
  decimals: number;
  aliased: boolean;
  price: string;
}

export interface DeDustPrice {
  address: string;
  value: string;
}
