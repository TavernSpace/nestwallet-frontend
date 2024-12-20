import {
  BACKEND_EVENT,
  CHANNEL_TON_RPC_NOTIFICATION,
  CHANNEL_TON_RPC_REQUEST,
  NOTIFICATION_TON_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_TON_CONNECTED,
  NOTIFICATION_TON_DISCONNECTED,
  TON_RPC_METHOD_APP_REQUEST,
  TON_RPC_METHOD_CONNECT,
  TON_RPC_METHOD_DISCONNECT,
  TON_RPC_METHOD_RESTORE_CONNECTION,
} from '@nestwallet/app/common/constants';
import { ChainId } from '@nestwallet/app/features/chain';
import { TonTransactionRequest } from '@nestwallet/app/features/tvm/signer/types';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { Address } from '@ton/core';
import { AppRequest, ConnectRequest, RpcMethod } from '@tonconnect/protocol';
import EventEmitter from 'eventemitter3';
import { ContentScriptChannel } from '../../common/channel/content-script-channel';
import { getLogger } from '../../common/logger';
import { Notification, RequestContext, RpcResponse } from '../../common/types';
import {
  openApproveConnectionPopupWindow,
  openApproveTransactionPopupWindow,
} from '../popup';
import { ApprovalService } from './approval-service';
import { ConnectionService } from './connection-service';
import { UserService } from './user-service';
import { getOrigin, withRequestContext } from './utils';

const logger = getLogger('background', 'ton-service');

export class TonService {
  private events: EventEmitter;
  private userService: UserService;
  private connectionService: ConnectionService;
  private approvalService: ApprovalService;

  constructor(
    events: EventEmitter,
    approvalService: ApprovalService,
    connectionService: ConnectionService,
    userService: UserService,
  ) {
    this.events = events;
    this.approvalService = approvalService;
    this.connectionService = connectionService;
    this.userService = userService;
  }

  public start() {
    const tonRpcServerInjected = ContentScriptChannel.server(
      CHANNEL_TON_RPC_REQUEST,
    );
    const tonNotificationsInjected = ContentScriptChannel.client(
      CHANNEL_TON_RPC_NOTIFICATION,
    );
    const sendMessageToConnectedTabs = async (notification: Notification) => {
      const ids = await this.connectionService.getConnectedTabIds(
        IBlockchainType.Tvm,
      );
      return tonNotificationsInjected.sendMessageTabs(ids, notification);
    };

    // TODO: we probably need to change this, when the connection popup is open,
    // if the user switches tabs the active tab will be wrong
    this.events.on(BACKEND_EVENT, (notification: Notification) => {
      switch (notification.name) {
        case NOTIFICATION_TON_CONNECTED:
        case NOTIFICATION_TON_DISCONNECTED:
        case NOTIFICATION_TON_ACTIVE_WALLET_UPDATED:
          notification.origin
            ? tonNotificationsInjected.sendMessageOrigin(notification)
            : sendMessageToConnectedTabs(notification);
          break;
        default:
          break;
      }
    });
    tonRpcServerInjected.handler(withRequestContext(this.handle.bind(this)));
  }

  private async handle(ctx: RequestContext): Promise<RpcResponse> {
    logger.debug(`handle ${ctx.request.method}`, ctx.request);
    const { method, params } = ctx.request;
    // connection requests can come from any origin. All other requests *must*
    // come from an approved origin.
    // TODO: check if user is logged in, probably add logic to navigator which redirects back to approval

    switch (method) {
      case TON_RPC_METHOD_CONNECT:
        return this.handleTonConnect(ctx, params[0]);
      case TON_RPC_METHOD_RESTORE_CONNECTION:
        return this.handleTonRestoreConnection(ctx);
      case TON_RPC_METHOD_DISCONNECT:
        return this.handleTonDisconnect(ctx);
      case TON_RPC_METHOD_APP_REQUEST:
        return this.handleTonAppRequest(ctx, params[0]);
      default:
        throw new Error(`unexpected rpc method: ${method}`);
    }
  }

  private async handleTonConnect(
    ctx: RequestContext,
    request: ConnectRequest & { manifest: { name: string; url: string } },
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    const tabId = ctx.sender.tab?.id;
    const windowId = ctx.sender.tab?.windowId;
    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    const connectionPopup = () => {
      return openApproveConnectionPopupWindow({
        requestId,
        tabId,
        windowId,
        origin,
        chainId: ChainId.Ton,
        blockchain: IBlockchainType.Tvm,
        items: request.items,
        manifest: request.manifest,
      });
    };
    return this.approvalService.requestUiAction(
      IBlockchainType.Tvm,
      requestId,
      tabId,
      connectionPopup,
    );
  }

  private async handleTonRestoreConnection(ctx: RequestContext) {
    return this.rejectRequest(ctx, 'Automatic reconnection disabled');
  }

  private async handleTonAppRequest<T extends RpcMethod>(
    ctx: RequestContext,
    message: AppRequest<T>,
  ) {
    switch (message.method) {
      case 'disconnect': {
        await this.handleTonDisconnect(ctx);
        break;
      }
      case 'sendTransaction': {
        await this.handleTonSendTransaction(ctx, message.params);
        break;
      }
      case 'signData': {
        this.handleTonSignData(ctx);
        break;
      }
    }
  }

  private async handleTonDisconnect(ctx: RequestContext) {
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    await this.userService.disconnect(origin.url);
  }

  private async handleTonSignData(ctx: RequestContext) {
    return this.rejectRequest(ctx, 'Message signing currently not supported');
  }

  private async handleTonSendTransaction(
    ctx: RequestContext,
    params: TonTransactionRequest | string[],
  ) {
    const requestId = ctx.request.id;
    const tabId = ctx.sender.tab?.id;
    const windowId = ctx.sender.tab?.windowId;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    } else if (params.length !== 1) {
      return this.rejectRequest(ctx, 'Malformed transaction request');
    }
    const param: TonTransactionRequest[number] =
      typeof params[0]! === 'string' ? JSON.parse(params[0]!) : params[0]!;
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Tvm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }

    return this.approvalService.requestUiAction(
      IBlockchainType.Tvm,
      requestId,
      tabId,
      () =>
        openApproveTransactionPopupWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          blockchain: IBlockchainType.Tvm,
          walletAddress: param.from
            ? Address.parseRaw(param.from).toString({
                urlSafe: true,
                bounceable: false,
              })
            : '',
          txs: param.messages.map((message) =>
            JSON.stringify({
              address: message.address,
              amount: message.amount,
              body: message.payload,
              bounce: true,
            }),
          ),
        }),
    );
  }

  private resolveRequest<TData = unknown>(ctx: RequestContext, data: TData) {
    this.approvalService.resolveRequest(ctx, IBlockchainType.Tvm, data);
  }

  private rejectRequest<TError = unknown>(ctx: RequestContext, error: TError) {
    this.approvalService.resolveRequest(
      ctx,
      IBlockchainType.Tvm,
      undefined,
      error,
    );
  }
}
