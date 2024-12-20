export interface SwapCoffeeRouteInput {
  input_token: TokenAddress;
  output_token: TokenAddress;
  input_amount?: number;
  output_amount?: number;
  max_splits?: number;
  max_length?: number;
  pool_selector?: PoolSelector;
  additional_data?: RouteRequestAdditionalData;
}

export interface PoolSelector {
  blockchains: string[];
  dexes: string[];
  max_volatility: number;
}

export interface RouteRequestAdditionalData {
  sender_address?: string;
  referral_name?: string;
}

export type SwapCoffeeRoute = SwapCoffeeRouteResponse;

export interface SwapCoffeeRouteResponse {
  input_token: Token;
  output_token: Token;
  input_amount: number;
  output_amount: number;
  input_usd: number;
  output_usd: number;
  savings?: number;
  left_amount?: number;
  recommended_gas: number;
  price_impact: number;
  estimated_cashback_usd?: number;
  paths: RoutingStep[];
}

export interface Token {
  address: TokenAddress;
  metadata: TokenMetadata;
}

export interface TokenAddress {
  blockchain: string;
  address: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  listed: boolean;
  image_url?: string;
}

export interface RoutingStep {
  blockchain: string;
  dex: string;
  pool_address: string;
  input_token: Token;
  output_token: Token;
  swap: Swap;
  recommended_gas: number;
  average_gas: number;
  next?: string[];
}

export interface Swap {
  result: string;
  input_amount: number;
  output_amount: number;
  before_reserves: number[];
  after_reserves: number[];
}

export interface SwapCoffeeTransactionsInput {
  sender_address: string;
  slippage: number;
  referral_name?: string;
  paths: RoutingStep[];
}

export interface SwapCoffeeTransactionsResponse {
  route_id: number;
  transactions: SwapTransaction[];
}

export interface SwapTransaction {
  address: string;
  value: string;
  cell: string;
  send_mode: number;
  query_id: number;
}
