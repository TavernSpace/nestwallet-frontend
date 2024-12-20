export interface JupiterQuoteInput {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  dexes: string[];
}

export type JupiterRoute = JupiterQuoteResponse;

export interface RoutePlan {
  ammKey: string;
  label?: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
  percent: number;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: RoutePlan[];
  swapInfo: {
    ammKey: string;
    label?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
    percent: number;
  };
  contextSlot?: number;
  timeTaken?: number;
  inputPriceUSD: string;
  outputPriceUSD: string;
  wrapAndUnwrapSol: boolean;
  fee: number;
}

export interface JupiterSwapInput {
  userPublicKey: string;
  quoteResponse: JupiterQuoteResponse;
  computeUnitPrice?: bigint;
  dynamicComputeUnitLimit?: boolean;
  computeUnitPriceMicroLamports?: number;
  wrapAndUnwrapSol?: boolean;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

export type JupiterSwappableTokensResponse = string[];

export interface JupiterTokenDetails {
  address: string;
  created_at: string;
  daily_volume: number;
  decimals: number;
  freeze_authority?: string | null;
  logoURI?: string | null;
  mint_authority?: string | null;
  minted_at: string;
  name: string;
  permanent_delegate?: string | null;
  symbol: string;
  tags: string[];
}

export type JupiterTokenDetailsResponse = JupiterTokenDetails[];

interface TokenPriceDetails {
  id: string;
  price: number;
}

interface TokenPriceDetailsV2 {
  id: string;
  type: string;
  price: string;
}

export type JupiterTokenPriceResponse = Record<string, TokenPriceDetails>;
export type JupiterTokenPriceResponseV2 = Record<string, TokenPriceDetailsV2>;

export interface JupiterToken {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  priceUSD?: string;
}

export type JupiterTokensResponse = JupiterToken[];
