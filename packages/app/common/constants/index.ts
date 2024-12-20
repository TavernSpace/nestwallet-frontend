export const BACKEND_EVENT = 'backend-event';

// internal requests our provider uses
export const SWITCH_PROVIDER_SWITCH_RESPONSE = 'SWITCH_PROVIDER_SWITCH';
export const SWITCH_PROVIDER_REMAIN_RESPONSE = 'SWITCH_PROVIDER_REMAIN';

export const CHANNEL_APP_RPC_REQUEST = 'channel-app-rpc';
export const CHANNEL_APP_RPC_NOTIFICATION = 'channel-app-notification';

export const POST_MESSAGE_ORIGIN = '*';

export const CHANNEL_ETHEREUM_RPC_REQUEST = 'channel-ethereum-rpc-request';
export const CHANNEL_ETHEREUM_RPC_RESPONSE = 'channel-ethereum-rpc-response';
export const CHANNEL_ETHEREUM_RPC_NOTIFICATION =
  'channel-ethereum-rpc-notification';

// Ethereum specific rpc method
export const ETHEREUM_RPC_METHOD_CONNECT = 'ethereum-connect';
export const ETHEREUM_RPC_METHOD_DISCONNECT = 'ethereum-disconnect';
export const ETHEREUM_RPC_METHOD_RPC_REQUEST = 'ethereum-rpc-request';
export const ETHEREUM_RPC_METHOD_SWITCH_CHAIN = 'ethereum-switch-chain';
export const ETHEREUM_RPC_METHOD_SIGN_TX = 'ethereum-sign-tx';
export const ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX = 'ethereum-sign-and-send-tx';
export const ETHEREUM_RPC_METHOD_SIGN_MESSAGE = 'ethereum-sign-message';
export const ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA = 'ethereum-sign-typed-data';
export const INTERNAL_METHOD_PROVIDER_STATE = 'internal-provider-state';

// Ethereum specific notifications
export const NOTIFICATION_ETHEREUM_CONNECTED =
  'notification-ethereum-connected';
export const NOTIFICATION_ETHEREUM_DISCONNECTED =
  'notification-ethereum-disconnected';
export const NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED =
  'notification-ethereum-active-wallet-updated';
export const NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED =
  'notification-ethereum-chain-id-updated';

export const CHANNEL_SOLANA_RPC_REQUEST = 'channel-solana-rpc-request';
export const CHANNEL_SOLANA_RPC_RESPONSE = 'channel-solana-rpc-response';
export const CHANNEL_SOLANA_RPC_NOTIFICATION =
  'channel-solana-rpc-notification';

export const NOTIFICATION_SOLANA_CONNECTED = 'notification-solana-connected';
export const NOTIFICATION_SOLANA_DISCONNECTED =
  'notification-solana-disconnected';
export const NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED =
  'notification-solana-active-wallet-updated';

export const SOLANA_RPC_METHOD_CONNECT = 'solana-connect';
export const SOLANA_RPC_METHOD_DISCONNECT = 'solana-disconnect';
export const SOLANA_RPC_METHOD_SIGN_MESSAGE = 'solana-sign-message';
export const SOLANA_RPC_METHOD_SIGN_TRANSACTIONS = 'solana-sign-transactions';

export const CHANNEL_TON_RPC_REQUEST = 'channel-ton-rpc-request';
export const CHANNEL_TON_RPC_RESPONSE = 'channel-ton-rpc-response';
export const CHANNEL_TON_RPC_NOTIFICATION = 'channel-ton-rpc-notification';

export const TON_RPC_METHOD_CONNECT = 'ton-connect';
export const TON_RPC_METHOD_RESTORE_CONNECTION = 'ton-restore-connection';
export const TON_RPC_METHOD_DISCONNECT = 'ton-restore-connection';
export const TON_RPC_METHOD_APP_REQUEST = 'ton-app-request';
export const TON_RPC_METHOD_TON_PROOF = 'ton-ton-proof';
export const TON_RPC_METHOD_SEND_TRANSACTION = 'ton-send-transaction';

export const NOTIFICATION_TON_CONNECTED = 'notification-ton-connected';
export const NOTIFICATION_TON_DISCONNECTED = 'notification-ton-disconnected';
export const NOTIFICATION_TON_ACTIVE_WALLET_UPDATED =
  'notification-ton-active-wallet-updated';

export interface INotification<T> {
  type: string;
  detail: {
    name: string;
    data: T;
  };
}

export interface IRPCRequest {
  type: string;
  detail: any;
}

export interface IRPCRespose {
  type: string;
  detail: {
    id: number;
    result: unknown;
    error: unknown;
  };
}

export interface IActiveWalletUpdate {
  publicKey: string;
}

export interface IChainIdUpdate {
  chainId: string;
}

export interface IConnected {
  publicKey: string;
  chainId: string;
}
