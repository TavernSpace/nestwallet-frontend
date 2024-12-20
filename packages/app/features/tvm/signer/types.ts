export interface AbstractTvmSigner {
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: string): Promise<string>;
  getPublicKey(): Promise<string>;
}

export type TonTransactionRequest = {
  messages: {
    address: string;
    amount: string;
    payload: string;
  }[];
  valid_until: number;
  from: string;
  network: string;
}[];
