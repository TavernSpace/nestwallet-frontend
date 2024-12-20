export interface AbstractSvmSigner {
  signMessage(message: string): Promise<string>;
  signTransactions(transactions: string[]): Promise<string[]>;
}
