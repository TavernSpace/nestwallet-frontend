import { ICryptoBalance } from '../../../graphql/client/generated/graphql';

export interface FourMemeInput {
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  amount: string;
  slippage: number;
  fee: number;
}

export interface FourMemeTokenDetailsResponse {
  data: FourMemeTokenMetadata;
}

export interface FourMemeTokenPriceDetails {
  price: string; // price of 1 token in BNB (not accurate for swap quote calculation)
  marketCap: string;
  tamount: string; // (virtual) token amount (used to calculate spot price)
  bamount: string; // (virtual) bnb amount (used to calculate spot price)
}

export interface FourMemeTokenMetadata {
  id: number;
  address: string;
  image: string;
  name: string;
  shortName: string; //SYMBOL
  descr: string;
  maxBuy: string | undefined;
  tokenPrice: FourMemeTokenPriceDetails;
}

export interface FourMemeRoute {
  txType: 'buy' | 'sell';
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  buyAmountWithPlatformFee?: string; // only used for token buy
  slippageBps: number;
  metadata: FourMemeTokenMetadata;
}
