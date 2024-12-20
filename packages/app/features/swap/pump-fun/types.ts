import { ICryptoBalance } from '../../../graphql/client/generated/graphql';

export interface Metadata {
  bondingCurveAddress: string;
  price: string;
  priceInSol: number | null;
}

export interface PumpFunRoute {
  txType: 'buy' | 'sell';
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  slippageBps: number;
  metadata: Metadata;
}

export interface PumpFunInput {
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  amount: string;
  slippage: number;
  fee: number;
}
