import { Runtime } from 'webextension-polyfill-ts';

// backfill missing types from webextension

// https://developer.chrome.com/docs/extensions/reference/runtime/#type-MessageSender
export interface Sender extends Runtime.MessageSender {
  origin?: string;
}

// nestwallet background types - contentscript / background

export type Notification = {
  name: string;
  origin?: string;
  data?: unknown;
};

export type RequestContext = {
  sender: Sender;
  request: RpcRequest;
};

export type RpcRequest = {
  id: string;
  method: string;
  params: any | any[];
};

export type RpcResponse<T = any> = T;

export type ResponseHandler = [
  (value: unknown) => void,
  (reason?: unknown) => void,
];
