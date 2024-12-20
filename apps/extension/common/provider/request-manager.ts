import { IRPCRespose } from '@nestwallet/app/common/constants';
import {
  decodeMessage,
  encodeMessage,
} from '@nestwallet/app/common/utils/encode';
import { serializeError } from 'eth-rpc-errors';
import { getLogger } from '../logger';
import type { ResponseHandler, RpcRequest, RpcResponse } from '../types';
import { isValidEventOrigin } from '../utils';

const logger = getLogger('provider', 'request-manager');

export class RequestManager {
  private _responseResolvers: { [requestId: number]: ResponseHandler } = {};
  private _requestId = 0;
  private _requestChannel: string;
  private _responseChannel: string;
  private _url: string;
  private isMobile: boolean;

  constructor(
    requestChannel: string,
    responseChannel: string,
    isMobile: boolean,
  ) {
    this._requestChannel = requestChannel;
    this._responseChannel = responseChannel;
    this._requestId = 0;
    this._responseResolvers = {};
    this._url = window.location.href;
    this.isMobile = isMobile;
    this.initChannels(this.isMobile);
  }

  private initChannels(useCapture: boolean) {
    window.addEventListener(
      'message',
      this.handleRpcResponse.bind(this),
      useCapture,
    );
  }

  private handleRpcResponse = (event: MessageEvent) => {
    if (!isValidEventOrigin(event)) return;
    const data = decodeMessage<IRPCRespose>(event.data);
    if (!data) return;
    if (data.type !== this._responseChannel) return;
    const { id, result, error } = data.detail;
    const resolver = this._responseResolvers[id];
    if (!resolver) {
      logger.error('unexpected event', event);
      return;
    }
    logger.debug(`response: ${JSON.stringify(data)}`);
    delete this._responseResolvers[id];
    const [resolve, reject] = resolver;
    if (error) {
      reject(serializeError(error));
    } else {
      resolve(result);
    }
  };

  // Sends a request from this script to the content script across the window.postMessage channel.
  public async request<T = any>({
    method,
    params,
  }: Omit<RpcRequest, 'id'>): Promise<RpcResponse<T>> {
    const id = this._requestId;
    this._requestId += 1;
    const promise = this._addResponseResolver(id);
    const payload = {
      type: this._requestChannel,
      // this._url will always be set here, because this._parent is true.
      href: this._url!,
      // TODO(Peter): what is this?
      iframeIdentifiers: window.name ? [window.name] : [],
      detail: {
        id,
        method,
        params,
      },
    };
    const encodedMessage = encodeMessage(payload);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(encodedMessage);
    } else {
      logger.debug(`request: ${JSON.stringify(payload)}`);
      window.parent.postMessage(encodedMessage, '*');
    }
    return (await promise) as Promise<T>;
  }

  // This must be called before `window.dispatchEvent`.
  private _addResponseResolver(requestId: number) {
    const prom = new Promise((resolve, reject) => {
      this._responseResolvers[requestId] = [resolve, reject];
    });
    return prom;
  }
}
