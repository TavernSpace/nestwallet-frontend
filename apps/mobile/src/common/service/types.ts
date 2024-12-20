import type { Origin } from '@nestwallet/app/common/types';
import type {
  IBlockchainType,
  IMessageType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import type { ConnectItem } from '@tonconnect/protocol';
import { Web3WalletTypes } from '@walletconnect/web3wallet';
import { TonConnectConnectionData } from './tonconnect/tonconnect-provider';

export type Notification = {
  name: string;
  origin?: string;
  data?: unknown;
};

export type RpcRequest = {
  id: string;
  method: string;
  params: any[];
};

export type ConnectionRequest = {
  requestId: string;
  origin: Origin;
  chainId: number;
  blockchain: IBlockchainType;
  items?: ConnectItem[];
  manifest?: {
    name: string;
    url: string;
  };
  tonConnectConnectionData?: TonConnectConnectionData;
  walletConnect?: Web3WalletTypes.SessionProposal;
};

export type TransactionRequest = {
  requestId: string;
  origin: Origin;
  txs: string[];
  walletAddress: string;
  blockchain: IBlockchainType;
  tonConnectConnectionData?: TonConnectConnectionData;
  walletConnect?: Web3WalletTypes.SessionRequest;
};

export type MessageRequest = {
  requestId: string;
  origin: Origin;
  type: IMessageType;
  message: string;
  chainId: number;
  walletAddress: string;
  blockchain: IBlockchainType;
  walletConnect?: Web3WalletTypes.SessionRequest;
};

export type RpcResponse<T = any> = T;

export type RequestContext = {
  sender: {
    title: string;
    url: string;
    imageUrl?: string;
  };
  request: RpcRequest;
  tonConnectConnectionData?: TonConnectConnectionData;
  walletConnect?: {
    proposal?: Web3WalletTypes.SessionProposal;
    request?: Web3WalletTypes.SessionRequest;
  };
};
