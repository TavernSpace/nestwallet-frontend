import {
  AppRequest,
  CONNECT_EVENT_ERROR_CODES,
  ConnectEvent,
  ConnectRequest,
  DeviceInfo,
  RpcMethod,
  WalletEvent,
  WalletResponse,
} from '@tonconnect/protocol';

export type TonConnectCallback = (event: WalletEvent | DisconnectEvent) => void;

// https://github.com/ton-connect/sdk/blob/main/packages/sdk/src/provider/injected/models/injected-wallet-api.ts
export interface TonConnectBridge {
  deviceInfo: DeviceInfo; // see Requests/Responses spec
  walletInfo?: WalletInfo;
  protocolVersion: number; // max supported Ton Connect version (e.g. 2)
  isWalletBrowser: boolean; // if the page is opened into wallet's browser
  connect(
    protocolVersion: number,
    message: ConnectRequest,
  ): Promise<ConnectEvent>;
  restoreConnection(): Promise<ConnectEvent>;
  send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>>;
  listen(callback: TonConnectCallback): () => void;
}

export interface DisconnectEvent {
  event: 'disconnect';
  id: number | string;
  payload: Record<string, never>;
}

export interface WalletInfo {
  name: string;
  image: string;
  tondns?: string;
  about_url: string;
}

export class TonConnectError extends Error {
  code: number;
  constructor(
    message: string,
    code: CONNECT_EVENT_ERROR_CODES = CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
  ) {
    super(message);
    this.code = code;
  }
}
