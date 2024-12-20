import {
  BACKEND_EVENT,
  CHANNEL_ETHEREUM_RPC_NOTIFICATION,
  CHANNEL_ETHEREUM_RPC_RESPONSE,
  ETHEREUM_RPC_METHOD_CONNECT,
  ETHEREUM_RPC_METHOD_DISCONNECT,
  ETHEREUM_RPC_METHOD_RPC_REQUEST,
  ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
  ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
  ETHEREUM_RPC_METHOD_SIGN_TX,
  ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
  ETHEREUM_RPC_METHOD_SWITCH_CHAIN,
  IChainIdUpdate,
  INTERNAL_METHOD_PROVIDER_STATE,
  NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
} from '@nestwallet/app/common/constants';
import { IApprovalResponse } from '@nestwallet/app/common/types';
import { encodeMessage } from '@nestwallet/app/common/utils/encode';
import { isSupportedChain } from '@nestwallet/app/features/chain';
import { getJSONRPCFunction } from '@nestwallet/app/features/evm/provider';
import { sanitizeTypedData } from '@nestwallet/app/features/keyring/utils';
import {
  IBlockchainType,
  IMessageType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { NavigationProp } from '@react-navigation/native';
import { ethErrors } from 'eth-rpc-errors';
import { ethers } from 'ethers';
import { EventEmitter } from 'eventemitter3';
import React from 'react';
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

export class EthereumService {
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

  public handleRequest(ctx: RequestContext) {
    if (!this.isInitialized) {
      throw new Error('ethereum service not initialized');
    }
    const { method, params } = ctx.request;
    // connection requests can come from any origin. All other requests *must*
    // come from an approved origin.
    // TODO: check if user is logged in, probably add logic to navigator which redirects back to approval
    switch (method) {
      case ETHEREUM_RPC_METHOD_CONNECT:
        return this.handleEthereumConnect(
          ctx,
          params[0],
          params[2],
          params[3],
          params[4],
        );
      case ETHEREUM_RPC_METHOD_DISCONNECT:
        return this.handleEthereumDisconnect(ctx);
      case ETHEREUM_RPC_METHOD_RPC_REQUEST:
        return this.handleEthereumRPC(ctx, params[0], params[1], params[2]);
      case ETHEREUM_RPC_METHOD_SWITCH_CHAIN:
        return this.handleEthereumSwitchChain(ctx, params[0]);
      case ETHEREUM_RPC_METHOD_SIGN_MESSAGE:
        return this.handleEthereumSignMessage(
          ctx,
          params[0],
          params[1],
          params[2],
        );
      case ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA:
        return this.handleEthereumSignTypedData(
          ctx,
          params[0],
          params[1],
          params[2],
        );
      case ETHEREUM_RPC_METHOD_SIGN_TX:
        return this.handleEthereumSignTx(ctx, params[0], params[1]);
      case ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX:
        return this.handleEthereumSignAndSendTx(ctx, params[0], params[1]);
      case INTERNAL_METHOD_PROVIDER_STATE:
        return this.handleProviderState(ctx);
      default:
        throw new Error(`unexpected rpc method: ${method}`);
    }
  }

  private async handleEthereumRPC(
    ctx: RequestContext,
    chainId: number,
    method: string,
    params: any,
  ) {
    const requestId = ctx.request.id;
    const requestFn = getJSONRPCFunction(chainId);
    try {
      const result = await requestFn({ method, params });
      this.resolveRequest(requestId, result);
    } catch (err) {
      this.resolveRequest(requestId, err);
    }
  }

  private async handleEthereumConnect(
    ctx: RequestContext,
    chainId: number,
    shouldPrompt: boolean,
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
      !!connectedSite && !!connectedSite.connections[IBlockchainType.Evm];
    const { evm } = await this.userService.getSelectedWallet();

    if (!shouldPrompt && isConnected && evm) {
      return this.resolveRequest(requestId, { publicKey: evm.address });
    } else if (!shouldPrompt && !isConnected) {
      return this.rejectRequest(requestId, 'Not connected to site');
    } else if (!shouldPrompt && isConnected && !evm) {
      return this.rejectRequest(requestId, 'No wallet selected');
    }

    if (!isConnected || ctx.walletConnect?.proposal) {
      this.navigateToApproveConnection({
        blockchain: IBlockchainType.Evm,
        requestId,
        origin,
        chainId,
        walletConnect: ctx.walletConnect?.proposal,
      });
    } else if (!evm) {
      this.navigateToApproveConnection({
        blockchain: IBlockchainType.Evm,
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
        evm,
      );
      this.resolveRequest(requestId, data);
    }
  }

  private async handleEthereumDisconnect(ctx: RequestContext) {}

  private async handleEthereumSwitchChain(
    ctx: RequestContext,
    chainId: number,
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(requestId, 'Not connected');
    }
    const chainHex = `0x${chainId.toString(16)}`;
    const { latest, evm, svm, tvm } =
      await this.userService.getSelectedWallet();
    if (!evm) {
      return;
    } else if (!isSupportedChain(chainId)) {
      this.rejectRequest(requestId, 'Invalid network');
      throw new Error('Network not supported');
    } else if (evm.type === IWalletType.Safe) {
      if (
        evm.supportedChainIds?.includes(chainId) // If Safe is deployed to the chain that the user is switching to
      ) {
        await this.userService.setSelectedWallet({
          latest,
          evm: { ...evm, chainId },
          svm,
          tvm,
        });
        await this.connectionService.addConnectedSite({
          origin: origin.url,
          title: connection.title ?? '',
          imageUrl: connection.favIconUrl ?? '',
          wallet: evm,
          chainId,
          blockchain: IBlockchainType.Evm,
        });
        this.resolveRequest(requestId, {
          origin: origin.url,
          chainId,
        });
      } else {
        this.rejectRequest(
          requestId,
          'Your Safe is not deployed on this network',
        );
        throw new Error('Network not supported');
      }
    } else {
      await this.connectionService.addConnectedSite({
        origin: origin.url,
        title: connection.title ?? '',
        imageUrl: connection.favIconUrl ?? '',
        wallet: evm,
        chainId,
        blockchain: IBlockchainType.Evm,
      });
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
        origin: origin.url,
        data: { chainId: chainHex } as IChainIdUpdate,
      });
      this.resolveRequest(requestId, {
        origin: origin.url,
        chainId,
      });
    }
  }

  handleEthereumSignMessage = async (
    ctx: RequestContext,
    message: string,
    walletAddress: string,
    chainId: number,
  ) => {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    // because of historical metamask standard, you must submit the message
    // to sign in hex - encoded UTF-8 hence we need to decode hexstring
    const decodedMessage = ethers.toUtf8String(message);
    this.navigateToApproveMessage({
      requestId,
      origin,
      type: IMessageType.Eip191,
      chainId,
      message: decodedMessage,
      walletAddress: walletAddress,
      blockchain: IBlockchainType.Evm,
      walletConnect: ctx.walletConnect?.request,
    });
  };

  // TODO: validate typed data shape
  private async handleEthereumSignTypedData(
    ctx: RequestContext,
    message: string,
    walletAddress: string,
    chainId: number,
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);

    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    // we should sanitize any data coming - sometimes they have extra
    // fields or extraneous types
    const typedData = sanitizeTypedData(JSON.parse(message));

    this.navigateToApproveMessage({
      requestId,
      origin: ctx.walletConnect?.request ? origin : connection || origin,
      type: IMessageType.Eip712,
      chainId,
      message: JSON.stringify(typedData),
      walletAddress: walletAddress,
      blockchain: IBlockchainType.Evm,
      walletConnect: ctx.walletConnect?.request,
    });
  }

  private async handleEthereumSignTx(
    ctx: RequestContext,
    tx: string,
    walletAddress: string,
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }

    this.navigateToApproveTransaction({
      requestId,
      origin: ctx.walletConnect?.request ? origin : connection || origin,
      txs: [tx],
      walletAddress: walletAddress,
      blockchain: IBlockchainType.Evm,
      walletConnect: ctx.walletConnect?.request,
    });
  }

  private async handleEthereumSignAndSendTx(
    ctx: RequestContext,
    tx: string,
    walletAddress: string,
  ) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection && !ctx.walletConnect?.request) {
      return this.rejectRequest(requestId, 'Not connected');
    }
    this.navigateToApproveTransaction({
      requestId,
      origin: ctx.walletConnect?.request ? origin : connection || origin,
      txs: [tx],
      walletAddress: walletAddress,
      blockchain: IBlockchainType.Evm,
      walletConnect: ctx.walletConnect?.request,
    });
  }

  // Internal handlers

  private async handleProviderState(ctx: RequestContext) {
    const requestId = ctx.request.id;
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(requestId, 'Invalid origin');
    }
    const [connectedSite, { evm }] = await Promise.all([
      this.connectionService.getConnectedSite(origin.url),
      this.userService.getSelectedWallet(),
    ]);
    if (
      !connectedSite ||
      !evm ||
      !connectedSite.connections[IBlockchainType.Evm]
    ) {
      return this.resolveRequest(requestId, { chainId: null, publicKey: null });
    }
    return this.resolveRequest(requestId, {
      chainId: connectedSite.connections[IBlockchainType.Evm].chainId,
      publicKey: evm.address,
    });
  }

  // communication with webViewRef

  private async sendNotifications(notification: {
    name: string;
    data: unknown;
  }) {
    const { name } = notification;
    const payload = encodeMessage({
      type: CHANNEL_ETHEREUM_RPC_NOTIFICATION,
      detail: notification,
    });
    if (!this.webViewRef?.current) return;
    if (name === NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED) {
      return this.webViewRef.current.postMessage(payload);
    }
    const isConnected = await this.connectionService.isCurrentSiteConnected(
      IBlockchainType.Evm,
    );
    if (!isConnected) return;
    this.webViewRef.current.postMessage(payload);
  }

  public async resolveApproval(input: IApprovalResponse) {
    if (!this.isInitialized) {
      throw new Error('ethereum service not initialized');
    }
    const payload = encodeMessage({
      type: CHANNEL_ETHEREUM_RPC_RESPONSE,
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
      type: CHANNEL_ETHEREUM_RPC_RESPONSE,
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
      type: CHANNEL_ETHEREUM_RPC_RESPONSE,
      detail: {
        id,
        result: undefined,
        error: ethErrors.provider.userRejectedRequest(
          typeof error === 'string' ? error : JSON.stringify(error),
        ),
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
