export type EthersSendCallback = (error: unknown, response: unknown) => void;

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#request
export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#rpc-errors
export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect-1
export interface ProviderConnectInfo {
  readonly chainId: string;
}

export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number;
}

export interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface RequestAccountParams {
  permissions?: Record<string, {}>[];
  canShowConnectionPrompt: boolean;
  canChooseProvider: boolean;
}

export const messages = {
  errors: {
    disconnected: () =>
      'Nest Wallet: Disconnected from network. Attempting to connect.',
    invalidRequestArgs: () =>
      `Nest Wallet: Expected a single, non-array, object argument.`,
    invalidRequestMethod: (method: string) =>
      `Nest Wallet: invalid request method=${method}`,
    invalidRequestParams: () =>
      `Nest Wallet: 'args.params' must be an object or array if provided.`,
  },
};

export interface BaseProviderState {
  accounts: null | string[];
  isConnected: boolean;
}
