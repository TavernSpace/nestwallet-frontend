// API documentation is outdated so some fields may be incorrect or missing

export interface RouterQuoteInput {
  amount: string;
  fromTokenAddress: string;
  fromTokenChainId: string;
  toTokenAddress: string;
  toTokenChainId: string;
  slippageTolerance?: string;
  destFuel?: string; // not sure what this does but router nitro always sets it to 0
}

export interface RouterQuoteResponse {
  flowType: string;
  isTransfer: string;
  isWrappedToken: boolean;
  allowanceTo: string;
  bridgeFee: BridgeFee;
  fuelTransfer: unknown; // has always been null in testing
  fromTokenAddress: string;
  toTokenAddress: string;
  source: Token;
  destination: Token;
  partnerId: string;
  slippageTolerance: string;
  estimatedTime: number;
}

export interface BridgeFee {
  amount: string;
  decimals: number;
  symbol: string;
  address: string;
}

export interface Token {
  chainId: string;
  chainType: string;
  asset: Asset;
  stableReserveAsset: Asset;
  tokenAmount: string;
  stableReserveAmount: string;
  priceImpact: string;
  tokenPath: string;
  dataTx: string[];
  path: string[];
  flags: string[];
}

export interface Asset {
  decimals: number;
  symbol: string;
  name: string;
  chainId: string;
  address: string;
  resourceID: string;
  isMintable: boolean;
  isWrappedAsset: boolean;
  isReserveAsset?: boolean;
  tokenInstance?: TokenInstance;
}

export interface TokenInstance {
  decimals: number;
  symbol: string;
  name: string;
  chainId: number;
  address: string;
}

export type RouterRoute = RouterQuoteResponse;

export interface RouterTransactionInput extends RouterQuoteResponse {
  senderAddress: string;
  receiverAddress: string;
  refundAddress?: string;
}

export interface RouterTransactionResponse extends RouterTransactionInput {
  txn: {
    data: string;
    from: string;
    gasLimit: string;
    gasPrice: string;
    to: string;
    value: string;
  };
}
