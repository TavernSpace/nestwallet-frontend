/// <reference types="nativewind/types" />

declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.mp3';
declare module '*.ogg';
declare module '*.wav';


declare namespace NodeJS {
  interface Process {
    browser: boolean;
  }
}

interface EvmWalletProvider {
  on: (eventName: string, listener: (...args: unknown[]) => void) => unknown;
  removeListener: (
    eventName: string,
    listener: (...args: unknown[]) => void,
  ) => unknown;
  request: (input: { method: string, params?: any }) => Promise<unknown>
  [prop: string]: unknown;
}

interface SvmWalletProvider {
  publicKey: PublicKey | null;
  connect(options?: {
    silent?: boolean;
  }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions,
  ): Promise<{ signature: TransactionSignature }>;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signIn(input?: SolanaSignInInput): Promise<SolanaSignInOutput>;
}

interface TvmWalletProvider {
  provider: TonProvider;
  tonconnect: TonConnectBridge;
}

interface Window {
  ReactNativeWebView: {
    postMessage: (message: string) => void;
  };
  nestWalletRouter: {
    getProviders(): EvmWalletProvider[];
    switchProvider: (newProvider: EvmWalletProvider) => void;
  };
  ethereum?: EvmWalletProvider;
  phantom?: SvmWalletProvider;
  solana?: SvmWalletProvider;
  nestwallet?: {
    ethereum: EvmWalletProvider;
    solana: SvmWalletProvider;
    ton: TonProvider
    tonconnect: TonConnectBridge;
  };
  web3?: { currentProvider: EvmWalletProvider };
}
