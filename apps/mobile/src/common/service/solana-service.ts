import {
  BACKEND_EVENT,
  CHANNEL_SOLANA_RPC_NOTIFICATION,
  CHANNEL_SOLANA_RPC_RESPONSE,
  INTERNAL_METHOD_PROVIDER_STATE,
  SOLANA_RPC_METHOD_CONNECT,
  SOLANA_RPC_METHOD_DISCONNECT,
  SOLANA_RPC_METHOD_SIGN_MESSAGE,
  SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
} from '@nestwallet/app/common/constants';
import { IApprovalResponse } from '@nestwallet/app/common/types';
import { encodeMessage } from '@nestwallet/app/common/utils/encode';
import {
  IBlockchainType,
  IMessageType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { NavigationProp } from '@react-navigation/native';
import { EventEmitter } from 'eventemitter3';
import { WebView } from 'react-native-webview';
import { ConnectionService } from './connection-service';
import {
  ConnectionRequest,
  MessageRequest,
  RequestContext,
  TransactionRequest,
} from './types';
import { UserService } from './user-service';
import { getOrigin } from './utils';

export class SolanaService {
  private connectionService: ConnectionService;
  private userService: UserService;
  private eventEmitter: InstanceType<typeof EventEmitter<string>>;

  private navigation!: Omit<
    NavigationProp<ReactNavigation.RootParamList>,
    'getState'
  >;
  private webViewRef: React.RefObject<WebView> | null = null;
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

  public initialize(
    navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'>,
  ) {
    if (!this.isInitialized) {
      this.uninitialize();
      this.navigation = navigation;
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
      throw new Error('solana service not initialized');
    }
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
      case INTERNAL_METHOD_PROVIDER_STATE:
        return;
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

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }

    const connectedSite = await this.connectionService.getConnectedSite(
      origin.url,
    );
    const isConnected =
      !!connectedSite && !!connectedSite.connections[IBlockchainType.Svm];
    const { svm } = await this.userService.getSelectedWallet();

    if (silent && connectedSite && svm) {
      const data = await this.userService.connect(
        origin.url,
        origin.title ?? new URL(origin.url).hostname,
        origin.favIconUrl ?? '',
        chainId,
        svm,
      );
      return this.resolveRequest(requestId, data);
    } else if (silent && !isConnected) {
      return this.rejectRequest(requestId, 'Not connected to site');
    } else if (silent && isConnected && !svm) {
      return this.rejectRequest(requestId, 'No wallet selected');
    }

    if (!isConnected || !svm || ctx.walletConnect?.proposal) {
      this.navigateToApproveConnection({
        blockchain: IBlockchainType.Svm,
        requestId,
        origin,
        chainId,
        walletConnect: ctx.walletConnect?.proposal,
      });
    } else {
      const data = await this.userService.connect(
        origin.url,
        origin.title ?? new URL(origin.url).hostname,
        origin.favIconUrl ?? '',
        chainId,
        svm,
      );
      this.resolveRequest(requestId, data);
    }
  }

  private async handleSolanaDisconnect(ctx: RequestContext) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
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
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Svm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    this.navigateToApproveMessage({
      requestId,
      origin: ctx.walletConnect?.request ? origin : connection || origin,
      type: IMessageType.Svm,
      message,
      chainId,
      walletAddress,
      blockchain: IBlockchainType.Svm,
      walletConnect: ctx.walletConnect?.request,
    });
  }

  private async handleSolanaSignTransactions(
    ctx: RequestContext,
    walletAddress: string,
    txs: string[],
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Svm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    this.navigateToApproveTransaction({
      requestId,
      origin: ctx.walletConnect?.request ? origin : connection || origin,
      blockchain: IBlockchainType.Svm,
      walletAddress: walletAddress,
      txs,
      walletConnect: ctx.walletConnect?.request,
    });
  }

  // communication with webViewRef

  private async sendNotifications(data: unknown) {
    const payload = encodeMessage({
      type: CHANNEL_SOLANA_RPC_NOTIFICATION,
      detail: data,
    });
    if (!this.webViewRef?.current) return;
    const isConnected = await this.connectionService.isCurrentSiteConnected(
      IBlockchainType.Svm,
    );
    if (isConnected) {
      this.webViewRef.current.postMessage(payload);
    }
  }

  public async resolveApproval(input: IApprovalResponse) {
    if (!this.isInitialized) {
      throw new Error('solana service not initialized');
    }
    const payload = encodeMessage({
      type: CHANNEL_SOLANA_RPC_RESPONSE,
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

  public async resolveRequest<TData = unknown>(requestId: string, data: TData) {
    if (!this.isInitialized) {
      throw new Error('solana service not initialized');
    }
    const payload = encodeMessage({
      type: CHANNEL_SOLANA_RPC_RESPONSE,
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
      type: CHANNEL_SOLANA_RPC_RESPONSE,
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

  navigateToApproveConnection(payload: ConnectionRequest) {
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
