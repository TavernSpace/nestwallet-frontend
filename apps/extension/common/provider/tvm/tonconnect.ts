import {
  CHANNEL_TON_RPC_NOTIFICATION,
  INotification,
  NOTIFICATION_TON_DISCONNECTED,
  TON_RPC_METHOD_APP_REQUEST,
  TON_RPC_METHOD_CONNECT,
  TON_RPC_METHOD_DISCONNECT,
  TON_RPC_METHOD_RESTORE_CONNECTION,
} from '@nestwallet/app/common/constants';
import { decodeMessage } from '@nestwallet/app/common/utils/encode';
import { getDeviceInfo } from '@nestwallet/app/features/tvm/utils';
import type {
  AppRequest,
  ConnectEvent,
  ConnectItemReply,
  ConnectRequest,
  DeviceInfo,
  RpcMethod,
  WalletEvent,
  WalletResponse,
} from '@tonconnect/protocol';
import { TonProvider } from '.';
import { getLogger } from '../../logger';
import { isMobile, isValidEventOrigin } from '../../utils';
import {
  DisconnectEvent,
  TonConnectBridge,
  TonConnectCallback,
  TonConnectError,
  WalletInfo,
} from './types';
import { formatConnectEventError, getPlatform } from './utils';

const logger = getLogger('provider', 'ton-injection');

export class TonConnect implements TonConnectBridge {
  callbacks: TonConnectCallback[] = [];

  deviceInfo: DeviceInfo = getDeviceInfo(getPlatform());

  // TODO(Ton):
  walletInfo: WalletInfo = {
    name: 'Tonkeeper',
    image: 'https://tonkeeper.com/assets/tonconnect-icon.png',
    tondns: 'tonkeeper.ton',
    about_url: 'https://tonkeeper.com',
  };

  protocolVersion = 2;

  isMobile = isMobile();

  isWalletBrowser = this.isMobile;

  connectionRequest?: Promise<ConnectEvent>;

  constructor(private provider: TonProvider) {
    provider.on('chainChanged', () => {
      this.notify({
        event: 'disconnect',
        id: Date.now(),
        payload: {},
      });
    });

    provider.on('tonConnect_event', (params) => {
      this.notify({
        event: params.event,
        id: params.id ?? Date.now(),
        payload: params.payload,
      });
    });

    window.addEventListener(
      'message',
      this.handleNotification.bind(this),
      this.isMobile,
    );
  }

  connect = async (
    protocolVersion: number,
    message: ConnectRequest,
  ): Promise<ConnectEvent> => {
    if (protocolVersion > this.protocolVersion) {
      return this.notify(
        formatConnectEventError(
          new TonConnectError('Unsupported protocol version', 1),
        ),
      );
    }
    try {
      if (this.connectionRequest) {
        return this.connectionRequest;
      } else {
        const connectionRequest = this.makeConnectionRequest(message).finally(
          () => (this.connectionRequest = undefined),
        );
        this.connectionRequest = connectionRequest;
        return connectionRequest;
      }
    } catch (e) {
      if (e instanceof TonConnectError) {
        return this.notify(formatConnectEventError(e));
      } else {
        return this.notify(
          formatConnectEventError(
            new TonConnectError((e as Error).message ?? 'Unknown error'),
          ),
        );
      }
    }
  };

  disconnect = async () => {
    await this.provider.send(TON_RPC_METHOD_DISCONNECT);
    return this.notify<DisconnectEvent>({
      event: 'disconnect',
      id: Date.now(),
      payload: {},
    });
  };

  restoreConnection = async (): Promise<ConnectEvent> => {
    try {
      const result = await this.provider.send(
        TON_RPC_METHOD_RESTORE_CONNECTION,
      );
      return this.notify({
        event: 'connect',
        id: Date.now(),
        payload: {
          items: (result as { data: ConnectItemReply[] }).data,
          device: getDeviceInfo(getPlatform()),
        },
      });
    } catch (e) {
      if (e instanceof TonConnectError) {
        return this.notify(formatConnectEventError(e));
      } else {
        return this.notify(
          formatConnectEventError(
            new TonConnectError((e as Error).message ?? 'Unknown error'),
          ),
        );
      }
    }
  };

  public async send<T extends RpcMethod>(
    message: AppRequest<T>,
  ): Promise<WalletResponse<T>> {
    try {
      const result = await this.provider.send<string>(
        TON_RPC_METHOD_APP_REQUEST,
        message,
      );
      return {
        result,
        id: String(message.id),
      };
    } catch (e) {
      if (e instanceof TonConnectError) {
        return {
          error: e,
          id: String(message.id),
        };
      } else {
        return {
          error: new TonConnectError((e as Error).message ?? 'Unknown error'),
          id: String(message.id),
        };
      }
    }
  }

  listen = (callback: TonConnectCallback): (() => void) => {
    this.callbacks.push(callback);
    const callbacks = this.callbacks;
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  };

  notify = <E extends WalletEvent | DisconnectEvent>(event: E): E => {
    this.callbacks.forEach((item) => item(event));
    return event;
  };

  private handleNotification = async (event: MessageEvent) => {
    if (!isValidEventOrigin(event)) return;
    const data = decodeMessage<INotification<any>>(event.data);
    if (!data) return;
    if (data.type !== CHANNEL_TON_RPC_NOTIFICATION) return;
    logger.debug('notification', event);
    // TODO(Ton): what notifications we want to handle?
    switch (data.detail.name) {
      case NOTIFICATION_TON_DISCONNECTED:
        return this.notify<DisconnectEvent>({
          event: 'disconnect',
          id: Date.now(),
          payload: {},
        });
      default:
        logger.debug(`unexpected notification ${data.detail.name}`);
        return;
    }
  };

  private makeConnectionRequest = async (message: ConnectRequest) => {
    const manifestRes = await fetch(message.manifestUrl);
    const manifest = await manifestRes.json();
    const result = await this.provider.send(TON_RPC_METHOD_CONNECT, {
      ...message,
      manifest,
    });
    return this.notify({
      event: 'connect',
      id: Date.now(),
      payload: {
        items: (result as { data: ConnectItemReply[] }).data,
        device: getDeviceInfo(getPlatform()),
      },
    });
  };
}
