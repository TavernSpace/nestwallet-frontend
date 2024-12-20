export interface TonMessage {
  address: string;
  amount: string | bigint;
  body?: string;
  bounce?: boolean;
}

export type WalletVersion = 'V3R1' | 'V3R2' | 'V4' | 'W5';

export interface TonJettonData {
  name: string;
  image?: string;
  symbol: string;
  decimals?: number;
  description: string;
}
