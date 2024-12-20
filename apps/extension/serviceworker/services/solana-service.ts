import {
  BACKEND_EVENT,
  CHANNEL_SOLANA_RPC_NOTIFICATION,
  CHANNEL_SOLANA_RPC_REQUEST,
  NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_SOLANA_CONNECTED,
  NOTIFICATION_SOLANA_DISCONNECTED,
  SOLANA_RPC_METHOD_CONNECT,
  SOLANA_RPC_METHOD_DISCONNECT,
  SOLANA_RPC_METHOD_SIGN_MESSAGE,
  SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
} from '@nestwallet/app/common/constants';
import {
  IBlockchainType,
  IMessageType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import EventEmitter from 'eventemitter3';
import { ContentScriptChannel } from '../../common/channel/content-script-channel';
import { getLogger } from '../../common/logger';
import { Notification, RequestContext, RpcResponse } from '../../common/types';
import {
  openApproveConnectionPopupWindow,
  openApproveMessageWindow,
  openApproveTransactionPopupWindow,
} from '../popup';
import { ApprovalService } from './approval-service';
import { ConnectionService } from './connection-service';
import { UserService } from './user-service';
import { getOrigin, withRequestContext } from './utils';

const logger = getLogger('background', 'solana-service');

export class SolanaService {
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
    const solanaRpcServerInjected = ContentScriptChannel.server(
      CHANNEL_SOLANA_RPC_REQUEST,
    );
    const solanaNotificationsInjected = ContentScriptChannel.client(
      CHANNEL_SOLANA_RPC_NOTIFICATION,
    );
    const sendMessageToConnectedTabs = async (notification: Notification) => {
      const ids = await this.connectionService.getConnectedTabIds(
        IBlockchainType.Svm,
      );
      return solanaNotificationsInjected.sendMessageTabs(ids, notification);
    };

    // TODO: we probably need to change this, when the connection popup is open,
    // if the user switches tabs the active tab will be wrong
    this.events.on(BACKEND_EVENT, (notification: Notification) => {
      switch (notification.name) {
        case NOTIFICATION_SOLANA_CONNECTED:
        case NOTIFICATION_SOLANA_DISCONNECTED:
        case NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED:
          notification.origin
            ? solanaNotificationsInjected.sendMessageOrigin(notification)
            : sendMessageToConnectedTabs(notification);
          break;
        default:
          break;
      }
    });
    solanaRpcServerInjected.handler(withRequestContext(this.handle.bind(this)));
  }

  private async handle(ctx: RequestContext): Promise<RpcResponse> {
    logger.debug(`handle ${ctx.request.method}`, ctx.request);
    const { method, params } = ctx.request;
    // connection requests can come from any origin. All other requests *must*
    // come from an approved origin.
    // TODO: check if user is logged in, probably add logic to navigator which redirects back to approval

    switch (method) {
      case SOLANA_RPC_METHOD_CONNECT:
        return this.handleSolanaConnect(
          ctx,
          params[0],
          params[1],
          params[2],
          params[3],
        );
      case SOLANA_RPC_METHOD_DISCONNECT:
        return this.handleSolanaDisconnect(ctx);
      case SOLANA_RPC_METHOD_SIGN_MESSAGE:
        return this.handleSolanaSignMessage(
          ctx,
          params[0],
          params[1],
          params[2],
        );
      case SOLANA_RPC_METHOD_SIGN_TRANSACTIONS:
        return this.handleSolanaSignTransactions(ctx, params[0], params[1]);
      default:
        throw new Error(`unexpected rpc method: ${method}`);
    }
  }

  private async handleSolanaConnect(
    ctx: RequestContext,
    chainId: number,
    silent: boolean,
    openGraphTitle?: string,
    appleTouchIcon?: string,
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx, openGraphTitle, appleTouchIcon);
    const tabId = ctx.sender.tab?.id;
    const windowId = ctx.sender.tab?.windowId;

    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }

    const connectedSite = await this.connectionService.getConnectedSite(
      origin.url,
    );
    const isConnected =
      !!connectedSite && !!connectedSite.connections[IBlockchainType.Svm];
    const { svm } = await this.userService.getSelectedWallet();

    if (silent && isConnected && svm) {
      const data = await this.userService.connect(
        origin.url,
        origin.title ?? new URL(origin.url).hostname,
        origin.favIconUrl ?? '',
        chainId,
        svm,
      );
      return this.resolveRequest(ctx, data);
    } else if (silent && !isConnected) {
      return this.rejectRequest(ctx, 'Not connected to site');
    } else if (silent && isConnected && !svm) {
      return this.rejectRequest(ctx, 'No wallet selected');
    }

    const connectionPopup = () => {
      return openApproveConnectionPopupWindow({
        requestId,
        tabId,
        windowId,
        origin,
        chainId,
        blockchain: IBlockchainType.Svm,
      });
    };
    if (!isConnected) {
      return this.approvalService.requestUiAction(
        IBlockchainType.Svm,
        requestId,
        tabId,
        connectionPopup,
      );
    } else if (!svm) {
      this.approvalService.requestUiAction(
        IBlockchainType.Svm,
        requestId,
        tabId,
        connectionPopup,
      );
    } else {
      const data = await this.userService.connect(
        origin.url,
        origin.title ?? new URL(origin.url).hostname,
        origin.favIconUrl ?? '',
        chainId,
        svm,
      );
      this.resolveRequest(ctx, data);
    }
  }

  private async handleSolanaDisconnect(ctx: RequestContext) {
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    await this.userService.disconnect(origin.url);
  }

  private async handleSolanaSignMessage(
    ctx: RequestContext,
    walletAddress: string,
    message: string,
    chainId: number,
  ) {
    const requestId = ctx.request.id;
    const tabId = ctx.sender.tab?.id;
    const windowId = ctx.sender.tab?.windowId;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Svm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }

    this.approvalService.requestUiAction(
      IBlockchainType.Svm,
      requestId,
      tabId,
      () =>
        openApproveMessageWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          type: IMessageType.Svm,
          chainId,
          message: message,
          walletAddress: walletAddress,
          blockchain: IBlockchainType.Svm,
        }),
    );
  }

  private async handleSolanaSignTransactions(
    ctx: RequestContext,
    walletAddress: string,
    txs: string[],
  ) {
    const requestId = ctx.request.id;
    const tabId = ctx.sender.tab?.id;
    const windowId = ctx.sender.tab?.windowId;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Svm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }

    this.approvalService.requestUiAction(
      IBlockchainType.Svm,
      requestId,
      tabId,
      () =>
        openApproveTransactionPopupWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          blockchain: IBlockchainType.Svm,
          walletAddress: walletAddress,
          txs,
        }),
    );
  }

  private resolveRequest<TData = unknown>(ctx: RequestContext, data: TData) {
    this.approvalService.resolveRequest(ctx, IBlockchainType.Svm, data);
  }

  private rejectRequest<TError = unknown>(ctx: RequestContext, error: TError) {
    this.approvalService.resolveRequest(
      ctx,
      IBlockchainType.Svm,
      undefined,
      error,
    );
  }
}
