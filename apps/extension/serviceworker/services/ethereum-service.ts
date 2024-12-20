import {
  BACKEND_EVENT,
  CHANNEL_ETHEREUM_RPC_NOTIFICATION,
  CHANNEL_ETHEREUM_RPC_REQUEST,
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
  NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
  NOTIFICATION_ETHEREUM_CONNECTED,
  NOTIFICATION_ETHEREUM_DISCONNECTED,
} from '@nestwallet/app/common/constants';
import { getChainInfo, isSupportedChain } from '@nestwallet/app/features/chain';
import { getJSONRPCFunction } from '@nestwallet/app/features/evm/provider';
import { sanitizeTypedData } from '@nestwallet/app/features/keyring/utils';
import {
  IBlockchainType,
  IMessageType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ethErrors } from 'eth-rpc-errors';
import { ethers, getAddress } from 'ethers';
import EventEmitter from 'eventemitter3';
import { ContentScriptChannel } from '../../common/channel/content-script-channel';
import { getLogger } from '../../common/logger';
import { Notification, RequestContext, RpcResponse } from '../../common/types';
import {
  openApproveChooseProviderPopupWindow,
  openApproveConnectionPopupWindow,
  openApproveMessageWindow,
  openApproveTransactionPopupWindow,
  showInvalidChainMessage,
  showSafeNotDeployedMessage,
} from '../popup';
import { ApprovalService } from './approval-service';
import { ConnectionService } from './connection-service';
import { UserService } from './user-service';
import { getOrigin, withRequestContext } from './utils';

const logger = getLogger('background', 'ethereum-service');

export class EthereumService {
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
    const ethereumRpcServerInjected = ContentScriptChannel.server(
      CHANNEL_ETHEREUM_RPC_REQUEST,
    );
    const ethereumNotificationsInjected = ContentScriptChannel.client(
      CHANNEL_ETHEREUM_RPC_NOTIFICATION,
    );
    const sendMessageToConnectedTabs = async (notification: Notification) => {
      const ids = await this.connectionService.getConnectedTabIds(
        IBlockchainType.Evm,
      );
      return ethereumNotificationsInjected.sendMessageTabs(ids, notification);
    };

    // TODO: we probably need to change this, when the connection popup is open,
    // if the user switches tabs the active tab will be wrong
    this.events.on(BACKEND_EVENT, (notification: Notification) => {
      switch (notification.name) {
        case NOTIFICATION_ETHEREUM_CONNECTED:
        case NOTIFICATION_ETHEREUM_DISCONNECTED:
        case NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED:
          notification.origin
            ? ethereumNotificationsInjected.sendMessageOrigin(notification)
            : sendMessageToConnectedTabs(notification);
          break;
        case NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED:
          notification.origin
            ? ethereumNotificationsInjected.sendMessageOrigin(notification)
            : ethereumNotificationsInjected.sendMessageAllTabs(notification);
          break;
        default:
          break;
      }
    });

    ethereumRpcServerInjected.handler(
      withRequestContext(this.handle.bind(this)),
    );
  }

  private async handle(ctx: RequestContext): Promise<RpcResponse> {
    logger.debug(`handle ${ctx.request.method}`, ctx.request);
    const { method, params } = ctx.request;
    // connection requests can come from any origin. All other requests *must*
    // come from an approved origin.
    // TODO: check if user is logged in, probably add logic to navigator which redirects back to approval

    switch (method) {
      case ETHEREUM_RPC_METHOD_CONNECT:
        return this.handleEthereumConnect(
          ctx,
          params[0],
          params[1],
          params[2],
          params[3],
          params[4],
        );
      case ETHEREUM_RPC_METHOD_DISCONNECT:
        return this.handleEthereumDisconnect();
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
    const requestFn = getJSONRPCFunction(chainId);
    try {
      const result = await requestFn({ method, params });
      this.resolveRequest(ctx, result);
    } catch (err) {
      this.rejectRequest(ctx, err);
    }
  }

  private async handleEthereumConnect(
    ctx: RequestContext,
    chainId: number,
    multipleProviders: boolean,
    shouldPrompt: boolean,
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

    const connectionPopup = () => {
      return openApproveConnectionPopupWindow({
        requestId,
        tabId,
        windowId,
        origin,
        chainId,
        blockchain: IBlockchainType.Evm,
      });
    };
    const chooseProviderPopup = () => {
      return openApproveChooseProviderPopupWindow({
        requestId,
        tabId,
        windowId,
        origin,
        blockchain: IBlockchainType.Evm,
      });
    };

    const connectedSite = await this.connectionService.getConnectedSite(
      origin.url,
    );
    const isConnected =
      !!connectedSite && !!connectedSite.connections[IBlockchainType.Evm];
    const { evm } = await this.userService.getSelectedWallet();

    if (!shouldPrompt && isConnected && evm) {
      return this.resolveRequest(ctx, { publicKey: evm.address });
    } else if (!shouldPrompt && !isConnected) {
      return this.rejectRequest(ctx, 'Not connected to site');
    } else if (!shouldPrompt && isConnected && !evm) {
      return this.rejectRequest(ctx, 'No wallet selected');
    }

    if (!isConnected) {
      const popupFunction = multipleProviders
        ? chooseProviderPopup
        : connectionPopup;
      return this.approvalService.requestUiAction(
        IBlockchainType.Evm,
        requestId,
        tabId,
        popupFunction,
      );
    } else if (!evm) {
      this.approvalService.requestUiAction(
        IBlockchainType.Evm,
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
        evm,
      );
      this.resolveRequest(ctx, data);
    }
  }

  private async handleEthereumDisconnect() {}

  private async handleEthereumSwitchChain(
    ctx: RequestContext,
    chainId: number,
  ) {
    const origin = getOrigin(ctx);
    const tabId = ctx.sender.tab?.id;
    if (!tabId) {
      return this.rejectRequest(ctx, 'Invalid tab');
    }
    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
    }
    const connection = await this.connectionService.connection(
      origin,
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }
    const chainHex = `0x${chainId.toString(16)}`;
    const { latest, evm, svm, tvm } =
      await this.userService.getSelectedWallet();
    if (!evm) {
      return;
    } else if (!isSupportedChain(chainId)) {
      await showInvalidChainMessage(tabId).catch(() => {});
      return this.rejectRequest(ctx, 'Invalid network');
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
          title: origin.title ?? '',
          imageUrl: origin.favIconUrl ?? '',
          wallet: evm,
          chainId,
          blockchain: IBlockchainType.Evm,
        });
        this.resolveRequest(ctx, {
          origin: origin.url,
          chainId,
        });
      } else {
        await showSafeNotDeployedMessage(
          tabId,
          getChainInfo(chainId).name,
        ).catch(() => {});
        return this.rejectRequest(ctx, 'Invalid network');
      }
    } else {
      await this.connectionService.addConnectedSite({
        origin: origin.url,
        title: origin.title ?? '',
        imageUrl: origin.favIconUrl ?? '',
        wallet: evm,
        chainId,
        blockchain: IBlockchainType.Evm,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
        origin: origin.url,
        data: { chainId: chainHex } as IChainIdUpdate,
      });
      this.resolveRequest(ctx, {
        origin: origin.url,
        chainId,
      });
    }
  }

  private async handleEthereumSignMessage(
    ctx: RequestContext,
    message: string,
    walletAddress: string,
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
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }

    // because of historical metamask standard, you must submit the message
    // to sign in hex - encoded UTF-8 hence we need to decode hexstring
    const decodedMessage = ethers.toUtf8String(message);
    this.approvalService.requestUiAction(
      IBlockchainType.Evm,
      requestId,
      tabId,
      () => {
        return openApproveMessageWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          type: IMessageType.Eip191,
          chainId,
          message: decodedMessage,
          walletAddress: getAddress(walletAddress),
          blockchain: IBlockchainType.Evm,
        });
      },
    );
  }

  // TODO: validate typed data shape
  private async handleEthereumSignTypedData(
    ctx: RequestContext,
    message: string,
    walletAddress: string,
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
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }
    // we should sanitize any data coming - sometimes they have extra
    // fields or extraneous types
    const typedData = sanitizeTypedData(JSON.parse(message));
    this.approvalService.requestUiAction(
      IBlockchainType.Evm,
      requestId,
      tabId,
      () => {
        return openApproveMessageWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          chainId,
          type: IMessageType.Eip712,
          message: JSON.stringify(typedData),
          walletAddress: getAddress(walletAddress),
          blockchain: IBlockchainType.Evm,
        });
      },
    );
  }

  private async handleEthereumSignTx(
    ctx: RequestContext,
    tx: string,
    walletAddress: string,
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
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }
    this.approvalService.requestUiAction(
      IBlockchainType.Evm,
      requestId,
      tabId,
      () => {
        return openApproveTransactionPopupWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          blockchain: IBlockchainType.Evm,
          walletAddress: getAddress(walletAddress),
          txs: [tx],
        });
      },
    );
  }

  private async handleEthereumSignAndSendTx(
    ctx: RequestContext,
    tx: string,
    walletAddress: string,
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
      IBlockchainType.Evm,
    );
    if (!connection) {
      return this.rejectRequest(ctx, 'Not connected');
    }
    this.approvalService.requestUiAction(
      IBlockchainType.Evm,
      requestId,
      tabId,
      () =>
        openApproveTransactionPopupWindow({
          requestId,
          tabId,
          windowId,
          origin: connection,
          txs: [tx],
          walletAddress: getAddress(walletAddress),
          blockchain: IBlockchainType.Evm,
        }),
    );
  }

  // Internal handlers

  private async handleProviderState(ctx: RequestContext) {
    const origin = getOrigin(ctx);
    if (!origin.url) {
      return this.rejectRequest(ctx, 'Invalid origin');
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
      return this.resolveRequest(ctx, { chainId: null, publicKey: null });
    }
    return this.resolveRequest(ctx, {
      chainId: connectedSite.connections[IBlockchainType.Evm].chainId,
      publicKey: evm.address,
    });
  }

  private resolveRequest<TData = unknown>(ctx: RequestContext, data: TData) {
    this.approvalService.resolveRequest(ctx, IBlockchainType.Evm, data);
  }

  private rejectRequest<TError = unknown>(ctx: RequestContext, error: TError) {
    this.approvalService.resolveRequest(
      ctx,
      IBlockchainType.Evm,
      undefined,
      ethErrors.provider.userRejectedRequest(
        typeof error === 'string' ? error : JSON.stringify(error),
      ),
    );
  }
}
