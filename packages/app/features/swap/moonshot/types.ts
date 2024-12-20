import { ICryptoBalance } from '../../../graphql/client/generated/graphql';

export interface MoonshotRoute {
  txType: 'buy' | 'sell';
  inputMint: string;
  inAmount: bigint;
  outputMint: string;
  outAmount: bigint;
  slippageBps: number;
  tokenMetadata: MoonshotTokenMetadata;
}
export interface MoonshotPrepareTransactionResponse {
  transaction: string;
  token: string;
}

export interface MoonshotTokenMetadata {
  url: string;
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
      total: number;
    };
    h1: {
      buys: number;
      sells: number;
      total: number;
    };
    h6: {
      buys: number;
      sells: number;
      total: number;
    };
    h24: {
      buys: number;
      sells: number;
      total: number;
    };
  };
  volume: {
    m5: {
      buys: number;
      sell: number;
      total: number;
    };
    h1: {
      buys: number;
      sell: number;
      total: number;
    };
    h6: {
      buys: number;
      sell: number;
      total: number;
    };
    h24: {
      buys: number;
      sell: number;
      total: number;
    };
  };
  makers: {
    m5: {
      buyers: number;
      sellers: number;
      total: number;
    };
    h1: {
      buyers: number;
      sellers: number;
      total: number;
    };
    h6: {
      buyers: number;
      sellers: number;
      total: number;
    };
    h24: {
      buyers: number;
      sellers: number;
      total: number;
    };
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  fdv: number;
  marketCap: number;
  createdAt: number;
  moonshot: {
    progress: number;
    creator: string;
    curveType: string;
    curvePosition: string;
    marketcapThreshold: string;
  };
  profile: {
    icon: string;
    banner: string;
    links: string[];
    decription: string;
  };
}

export interface MoonshotInput {
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  amount: string;
  slippage: number;
  fee: number;
}
