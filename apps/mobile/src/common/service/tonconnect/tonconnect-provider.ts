import {
  TON_RPC_METHOD_APP_REQUEST,
  TON_RPC_METHOD_CONNECT,
} from '@nestwallet/app/common/constants';
import {
  AppRequest,
  Base64,
  KeyPair,
  RpcMethod,
  SessionCrypto,
  hexToByteArray,
} from '@tonconnect/protocol';
import debounce from 'lodash/debounce';
import { EmitterSubscription, Linking } from 'react-native';
import EventSource, {
  EventSourceListener,
  MessageEvent,
} from 'react-native-sse';
import { AsyncJSONStorage, AsyncStorageKey } from '../storage';
import { TonService } from '../ton-service';
import { parseTonConnectParams } from './utils';

interface Manifest {
  url: string;
  name: string;
  iconUrl: string;
  termsOfUseUrl?: string;
  privacyPolicyUrl?: string;
}
interface TonConnectEncryptionData {
  keyPair: KeyPair;
  dappSessionId: string;
}

export interface TonConnectConnectionData extends TonConnectEncryptionData {
  title: string;
  url: string;
  favIconUrl: string;
}

// see: https://github.com/tonkeeper/wallet/blob/7452e11f8c6313f5a1f60bbc93e1b6a5e858470e/packages/mobile/src/tonconnect/TonConnectRemoteBridge.ts
export class TonConnectProvider {
  public static readonly BRIDGE_URL = 'https://bridge.tonapi.io/bridge';
  public static readonly PROTOCOL_VERSION = 2;
  public static readonly DEFAULT_TTL = '300';

  private eventSource: EventSource | null = null;
  private subscription: EmitterSubscription | null = null;

  constructor(
    private tonService: TonService,
    private asyncStorage: AsyncJSONStorage,
  ) {}

  async initialize() {
    this.uninitialize();
    const connections = await this.getConnections();
    if (Object.keys(connections).length === 0) {
      return;
    }
    const sessionIds = Object.values(connections)
      .map((connection) => new SessionCrypto(connection.keyPair).sessionId)
      .join(',');

    let sseUrl = `${TonConnectProvider.BRIDGE_URL}/events?client_id=${sessionIds}`;
    const lastEventId = await this.getLastEventId();
    if (lastEventId) {
      sseUrl += `&last_event_id=${lastEventId}`;
    }
    this.eventSource = new EventSource(sseUrl);
    this.eventSource.addEventListener(
      'message',
      debounce(this.handleMessage.bind(this), 200) as EventSourceListener,
    );
  }

  listenToUrl() {
    if (!this.subscription) {
      const onReceiveURL = async ({ url }: { url: string }) => {
        if (
          url.startsWith('tc://') ||
          url.startsWith('https://nestwallet.xyz/tonconnect')
        ) {
          await this.connect(url);
        }
      };
      this.subscription = Linking.addEventListener('url', onReceiveURL);
    }
  }

  uninitialize() {
    if (this.eventSource) {
      this.eventSource.removeAllEventListeners();
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.subscription) {
      this.subscription.remove();
    }
  }

  connect = async (url: string) => {
    const connectionParams = parseTonConnectParams(url);
    if (!connectionParams) return;
    // TODO: handle ret param
    const { protocolVersion, dappSessionId, message, ret } = connectionParams;
    const manifestRes = await fetch(message.manifestUrl);
    const manifest: Manifest = await manifestRes.json();
    const sender = {
      title: manifest.name,
      url: manifest.url,
      favIconUrl: manifest.iconUrl,
    };
    const params = [
      {
        ...message,
        manifest,
      },
    ];
    const request = {
      id: Date.now().toString(),
      method: TON_RPC_METHOD_CONNECT,
      params,
    };
    const sessionCrypto = new SessionCrypto();
    const connectionData = {
      ...sender,
      keyPair: sessionCrypto.stringifyKeypair(),
      dappSessionId,
    };
    await this.tonService.handleRequest({
      sender,
      request,
      tonConnectConnectionData: connectionData,
    });
  };

  private async setLastEventId(lastEventId: string) {
    try {
      await this.asyncStorage.set(
        AsyncStorageKey.TonConnectLastEventId,
        lastEventId,
      );
    } catch {
      return;
    }
  }

  private async getLastEventId() {
    try {
      return await this.asyncStorage.get(AsyncStorageKey.TonConnectLastEventId);
    } catch {
      return null;
    }
  }

  async upsertConnection(url: string, connection: TonConnectConnectionData) {
    const connections = await this.getConnections();
    connections[url] = connection;
    await this.asyncStorage.set(
      AsyncStorageKey.TonConnectConnections,
      connections,
    );
    await this.initialize();
  }

  async deleteConnection(url: string) {
    const connections = await this.getConnections();
    delete connections[url];
    await this.asyncStorage.set(
      AsyncStorageKey.TonConnectConnections,
      connections,
    );
    await this.initialize();
  }

  async disconnectAll() {
    await this.asyncStorage.set(AsyncStorageKey.TonConnectConnections, {});
  }

  async getConnections(): Promise<Record<string, TonConnectConnectionData>> {
    const connections = await this.asyncStorage.get(
      AsyncStorageKey.TonConnectConnections,
    );
    return connections ?? {};
  }

  async postMessage(
    encryptionData: TonConnectEncryptionData,
    data: Record<string, any>,
  ) {
    try {
      const sessionCrypto = new SessionCrypto(encryptionData.keyPair);
      const url = `${TonConnectProvider.BRIDGE_URL}/message?client_id=${sessionCrypto.sessionId}&to=${encryptionData.dappSessionId}&ttl=${TonConnectProvider.DEFAULT_TTL}`;

      const encodedResponse = sessionCrypto.encrypt(
        JSON.stringify(data),
        hexToByteArray(encryptionData.dappSessionId),
      );

      await fetch(url, {
        body: Base64.encode(encodedResponse),
        method: 'POST',
      });
    } catch (error) {
      throw new Error(`Failed to post tonconnect message: ${error}`);
    }
  }

  private async handleMessage(event: MessageEvent) {
    if (event.lastEventId) {
      this.setLastEventId(event.lastEventId);
    }

    const { from, message: _message } = JSON.parse(event.data!);
    const connections = await this.getConnections();
    const connectionData = Object.values(connections).find(
      (connection) => connection.dappSessionId === from,
    );
    if (!connectionData) {
      throw new Error('TonConnect request from unknown app');
    }
    const sessionCrypto = new SessionCrypto(connectionData.keyPair);
    const message: AppRequest<RpcMethod> = JSON.parse(
      sessionCrypto.decrypt(
        Base64.decode(_message).toUint8Array(),
        hexToByteArray(from),
      ),
    );
    const request = {
      id: message.id,
      method: TON_RPC_METHOD_APP_REQUEST,
      params: [message],
    };
    this.tonService.handleRequest({
      sender: connectionData,
      request,
      tonConnectConnectionData: connectionData,
    });
  }
}
