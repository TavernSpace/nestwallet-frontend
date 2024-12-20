import {
  CHANNEL_TON_RPC_REQUEST,
  CHANNEL_TON_RPC_RESPONSE,
} from '@nestwallet/app/common/constants/';
import EventEmitter from 'eventemitter3';
import { isMobile } from '../../utils';
import { RequestManager } from '../request-manager';

export class TonProvider extends EventEmitter {
  requestManager: RequestManager;

  isMobile: boolean;

  constructor() {
    super();
    this.isMobile = isMobile();
    this.requestManager = new RequestManager(
      CHANNEL_TON_RPC_REQUEST,
      CHANNEL_TON_RPC_RESPONSE,
      this.isMobile,
    );
  }

  public async send<Result>(method: string, ...params: any[]) {
    if (!method || typeof method !== 'string') {
      return Promise.reject('Method is not a valid string.');
    }
    const result = await this.requestManager.request({
      method,
      params,
    });
    return result as Result;
  }
}
