import {
  BACKEND_EVENT,
  CHANNEL_TON_RPC_NOTIFICATION,
  CHANNEL_TON_RPC_RESPONSE,
  TON_RPC_METHOD_APP_REQUEST,
  TON_RPC_METHOD_CONNECT,
  TON_RPC_METHOD_DISCONNECT,
  TON_RPC_METHOD_RESTORE_CONNECTION,
} from '@nestwallet/app/common/constants';
import { IApprovalResponse } from '@nestwallet/app/common/types';
import { encodeMessage } from '@nestwallet/app/common/utils/encode';
import { ChainId } from '@nestwallet/app/features/chain';
import { TonTransactionRequest } from '@nestwallet/app/features/tvm/signer/types';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import {
  NavigationContainerRefWithCurrent,
  NavigationProp,
} from '@react-navigation/native';
import { Address } from '@ton/core';
import { AppRequest, ConnectRequest, RpcMethod } from '@tonconnect/protocol';
import EventEmitter from 'eventemitter3';
import { WebView } from 'react-native-webview';
import { ConnectionService } from './connection-service';
import { TonConnectProvider } from './tonconnect/tonconnect-provider';
import {
  ConnectionRequest,
  MessageRequest,
  RequestContext,
  TransactionRequest,
} from './types';
import { UserService } from './user-service';
import { getOrigin } from './utils';

export class TonService {
  private connectionService: ConnectionService;
  private userService: UserService;
  private eventEmitter: InstanceType<typeof EventEmitter<string>>;

  private navigation!:
    | Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'>
    | NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  private webViewRef: React.RefObject<WebView> | null = null;
  private tonConnectProvider: TonConnectProvider | null = null;
  private isInitialized: boolean = false;

  constructor(
    eventEmitter: InstanceType<typeof EventEmitter<string>>,
    connectionService: ConnectionService,
    userService: UserService,
  ) {
    this.eventEmitter = eventEmitter;
    this.connectionService = connectionService;
    this.userService = userService;
  }

  public initialize({
    navigation,
    tonConnectProvider,
  }: {
    navigation:
      | Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'>
      | NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
    tonConnectProvider?: TonConnectProvider;
  }) {
    if (!this.isInitialized) {
      this.uninitialize();
      this.navigation = navigation;
      this.tonConnectProvider = tonConnectProvider ?? null;
      this.eventEmitter.on(BACKEND_EVENT, this.sendNotifications.bind(this));
      this.isInitialized = true;
    }
  }

  public uninitialize() {
    this.eventEmitter.off(BACKEND_EVENT, this.sendNotifications.bind(this));
    this.isInitialized = false;
  }

  public setWebView(webViewRef: React.RefObject<WebView> | null) {
    this.webViewRef = webViewRef;
  }

  public async handleRequest(ctx: RequestContext) {
    if (!this.isInitialized) {
      throw new Error('TonService is not initialized');
    }
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
    request: ConnectRequest & {
      manifest: { name: string; iconUrl: string; url: string };
    },
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(
      ctx,
      request.manifest.name,
      request.manifest.iconUrl,
    );
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    this.navigateToApproveConnection({
      requestId,
      origin,
      chainId: ChainId.Ton,
      blockchain: IBlockchainType.Tvm,
      items: request.items,
      manifest: request.manifest,
      tonConnectConnectionData: ctx.tonConnectConnectionData,
    });
  }

  private async handleTonRestoreConnection(ctx: RequestContext) {
    const requestId = ctx.request.id;
    return this.rejectRequest(requestId, 'Automatic reconnection disabled');
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
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    if (ctx.tonConnectConnectionData) {
      await this.tonConnectProvider?.deleteConnection(
        ctx.tonConnectConnectionData.url,
      );
    } else {
      await this.userService.disconnect(origin.url);
    }
  }

  private async handleTonSignData(ctx: RequestContext) {
    const requestId = ctx.request.id;
    return this.rejectRequest(
      requestId,
      'Message signing currently not supported',
    );
  }

  private async handleTonSendTransaction(
    ctx: RequestContext,
    params: TonTransactionRequest | string[],
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    } else if (params.length !== 1) {
      return this.rejectRequest(requestId, 'Malformed transaction request');
    }
    const param: TonTransactionRequest[number] =
      typeof params[0]! === 'string' ? JSON.parse(params[0]!) : params[0]!;
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Tvm,
    );
    if (!connection && !ctx.tonConnectConnectionData) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    this.navigateToApproveTransaction({
      requestId,
      origin: ctx.tonConnectConnectionData ? origin : connection || origin,
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
      tonConnectConnectionData: ctx.tonConnectConnectionData,
    });
  }

  // communication with webViewRef

  private async sendNotifications(data: unknown) {
    const payload = encodeMessage({
      type: CHANNEL_TON_RPC_NOTIFICATION,
      detail: data,
    });
    if (!this.webViewRef?.current) return;
    const isConnected = await this.connectionService.isCurrentSiteConnected(
      IBlockchainType.Tvm,
    );
    if (isConnected) {
      this.webViewRef.current.postMessage(payload);
    }
  }

  public async resolveApproval(input: IApprovalResponse) {
    if (!this.isInitialized) {
      throw new Error('TonService is not initialized');
    }
    const payload = encodeMessage({
      type: CHANNEL_TON_RPC_RESPONSE,
      detail: {
        id: input.requestId,
        result: input.result,
        error: input.error,
      },
    });
    if (this.webViewRef?.current) {
      this.webViewRef.current.postMessage(payload);
    }
  }

  private async resolveRequest<TData = unknown>(
    requestId: string,
    data: TData,
  ) {
    const payload = encodeMessage({
      type: CHANNEL_TON_RPC_RESPONSE,
      detail: {
        id: requestId,
        result: data,
        error: undefined,
      },
    });
    if (this.webViewRef?.current) {
      this.webViewRef.current.postMessage(payload);
    }
  }

  private rejectRequest<TError = unknown>(id: string, error: TError) {
    const payload = encodeMessage({
      type: CHANNEL_TON_RPC_RESPONSE,
      detail: {
        id,
        result: undefined,
        error: typeof error === 'string' ? error : JSON.stringify(error),
      },
    });
    if (this.webViewRef?.current) {
      this.webViewRef.current.postMessage(payload);
    }
  }

  // navigation

  private navigateToApproveConnection(payload: ConnectionRequest) {
    this.navigation.navigate('app', {
      screen: 'internalConnectionApproval',
      params: {
        screen: 'connection',
        params: {
          payload,
        },
      },
    });
  }

  private navigateToApproveTransaction(payload: TransactionRequest) {
    this.navigation.navigate('app', {
      screen: 'internalTransactionApproval',
      params: {
        screen: 'transaction',
        params: {
          payload,
        },
      },
    });
  }

  private navigateToApproveMessage(payload: MessageRequest) {
    this.navigation.navigate('app', {
      screen: 'internalMessageApproval',
      params: {
        screen: 'message',
        params: {
          payload,
        },
      },
    });
  }
}
