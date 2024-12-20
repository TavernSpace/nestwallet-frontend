import { RpcRequest } from '../types';

export interface RPCRequestMessage {
  channel: string;
  data: RpcRequest;
}

export interface RPCResponseMessage {
  channel: string;
  data: any;
}
