import {
  BACKEND_EVENT,
  IActiveWalletUpdate,
  IChainIdUpdate,
  IConnected,
  NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
  NOTIFICATION_ETHEREUM_CONNECTED,
  NOTIFICATION_ETHEREUM_DISCONNECTED,
  NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_SOLANA_CONNECTED,
  NOTIFICATION_SOLANA_DISCONNECTED,
  NOTIFICATION_TON_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_TON_CONNECTED,
  NOTIFICATION_TON_DISCONNECTED,
} from '@nestwallet/app/common/constants';
import {
  Preferences,
  TokenDetailSettings,
  TradeSettings,
  UserData,
} from '@nestwallet/app/common/types';
import { getOAuthProviderConfig } from '@nestwallet/app/features/oauth/utils';
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import {
  IBlockchainType,
  IOAuthProvider,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import EventEmitter from 'eventemitter3';
import { BackgroundStorageKey } from '../../../common/constants/worker/storage';
import { getLocalStorage, setLocalStorage } from '../../../common/storage';
import { RpcResponse } from '../../../common/types';
import { IOauthResponse } from '../../../common/wallet/interface';
import { ConnectionService } from '../connection-service';
import { generateCodeChallenge, generateCodeVerifier } from './oauth';

export const SUCCESS_RESPONSE = 'success';

export class UserService {
  private events: EventEmitter;
  private connectionService: ConnectionService;

  constructor(events: EventEmitter, connectionService: ConnectionService) {
    this.events = events;
    this.connectionService = connectionService;
  }

  public async connect(
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ) {
    const chainHex = `0x${chainId.toString(16)}`;
    const data: IConnected = {
      publicKey: wallet.address,
      chainId: chainHex,
    };
    const { evm, svm, tvm } = await this.getSelectedWallet();
    await this.connectionService.addConnectedSite({
      origin,
      title,
      imageUrl,
      wallet,
      chainId,
      blockchain: wallet.blockchain,
    });
    await this.setSelectedWallet({
      latest: wallet,
      evm: wallet.blockchain === IBlockchainType.Evm ? wallet : evm,
      svm: wallet.blockchain === IBlockchainType.Svm ? wallet : svm,
      tvm: wallet.blockchain === IBlockchainType.Tvm ? wallet : tvm,
    } as SelectedWalletInfo);
    if (wallet.blockchain === IBlockchainType.Evm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CONNECTED,
        origin,
        data,
      });
    } else if (wallet.blockchain === IBlockchainType.Svm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_CONNECTED,
        origin,
        data,
      });
    } else if (wallet.blockchain === IBlockchainType.Tvm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_CONNECTED,
        origin,
        data,
      });
    }
    return data;
  }

  public async disconnect(origin: string): Promise<RpcResponse<void>> {
    await this.connectionService.removeConnectedSite(origin);
    // don't know if its evm or svm - just send to both
    this.events.emit(BACKEND_EVENT, {
      name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      origin,
    });
    this.events.emit(BACKEND_EVENT, {
      name: NOTIFICATION_SOLANA_DISCONNECTED,
      origin,
    });
    this.events.emit(BACKEND_EVENT, {
      name: NOTIFICATION_TON_DISCONNECTED,
      origin,
    });
  }

  public async disconnectAll(): Promise<void> {
    const sites = await this.connectionService.removeConnectedSites();
    Object.keys(sites).forEach((origin) => {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_DISCONNECTED,
        origin,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_DISCONNECTED,
        origin,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_DISCONNECTED,
        origin,
      });
    });
  }

  public async getUserData(): Promise<UserData> {
    const key = BackgroundStorageKey.UserData;
    const userData = await getLocalStorage(key);
    if (!userData) {
      throw new Error('not logged in');
    }
    return userData as UserData;
  }

  public async setUserData(loginData: UserData | undefined) {
    const key = BackgroundStorageKey.UserData;
    return setLocalStorage(key, loginData);
  }

  public async getDeviceId(): Promise<string | undefined> {
    const key = BackgroundStorageKey.DeviceID;
    return getLocalStorage(key);
  }

  public async setDeviceId(deviceId: string | undefined): Promise<void> {
    const key = BackgroundStorageKey.DeviceID;
    return setLocalStorage(key, deviceId);
  }

  public async getPreferences(): Promise<Preferences> {
    const key = BackgroundStorageKey.Preferences;
    const data = await getLocalStorage(key);
    const defaultPreferenceData: Preferences = {
      profitLoss: 'pnl',
      stealthMode: false,
      audioMuted: false,
      showTransactionWidget: true,
    };
    return !data
      ? defaultPreferenceData
      : { ...defaultPreferenceData, ...data };
  }

  public async setPreferences(
    preferences: Preferences | undefined,
  ): Promise<void> {
    const key = BackgroundStorageKey.Preferences;
    return setLocalStorage(key, preferences);
  }

  public async getTradeSettings(): Promise<TradeSettings> {
    const key = BackgroundStorageKey.TradeSettings;
    const data = await getLocalStorage(key);
    const tradeSettingData: TradeSettings = {
      slippage: {},
      defaultSecondaryAsset: {},
      customGas: {},
      tip: '100000',
      mev: false,
      infiniteApproval: true,
      simulate: true,
    };
    return !data ? tradeSettingData : { ...tradeSettingData, ...data };
  }

  public async setTradeSettings(data: TradeSettings): Promise<void> {
    const key = BackgroundStorageKey.TradeSettings;
    return setLocalStorage(key, data);
  }

  public async getTokenDetailSettings(): Promise<TokenDetailSettings> {
    const key = BackgroundStorageKey.TokenSettings;
    const data = await getLocalStorage(key);
    const tokenSettingData: TokenDetailSettings = {
      chartType: 'candle',
    };
    return !data ? tokenSettingData : { ...tokenSettingData, ...data };
  }

  public async setTokenDetailSettings(
    data: TokenDetailSettings,
  ): Promise<void> {
    const key = BackgroundStorageKey.TokenSettings;
    return setLocalStorage(key, data);
  }

  public async getSelectedWallet(): Promise<SelectedWalletInfo> {
    const result: SelectedWalletInfo | undefined = await getLocalStorage(
      BackgroundStorageKey.SelectedWallet,
    );
    return (
      result ?? {
        latest: null,
        evm: null,
        svm: null,
        tvm: null,
      }
    );
  }

  public async setSelectedWallet(
    wallet: SelectedWalletInfo,
  ): Promise<SelectedWalletInfo> {
    const key = BackgroundStorageKey.SelectedWallet;
    if (!wallet.latest) {
      const nullValue = { latest: null, evm: null, svm: null, tvm: null };
      await setLocalStorage(key, nullValue);
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_DISCONNECTED,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_DISCONNECTED,
      });
      return nullValue;
    }
    // strip out extra data
    const latest = {
      id: wallet.latest.id,
      chainId: wallet.latest.chainId,
      blockchain: wallet.latest.blockchain,
      address: wallet.latest.address,
      type: wallet.latest.type,
      supportedChainIds: wallet.latest.supportedChainIds,
    };
    const evm = wallet.evm
      ? {
          id: wallet.evm.id,
          chainId: wallet.evm.chainId,
          blockchain: wallet.evm.blockchain,
          address: wallet.evm.address,
          type: wallet.evm.type,
          supportedChainIds: wallet.evm.supportedChainIds,
        }
      : null;
    const svm = wallet.svm
      ? {
          id: wallet.svm.id,
          chainId: wallet.svm.chainId,
          blockchain: wallet.svm.blockchain,
          address: wallet.svm.address,
          type: wallet.svm.type,
          supportedChainIds: wallet.svm.supportedChainIds,
        }
      : null;
    const tvm = wallet.tvm
      ? {
          id: wallet.tvm.id,
          chainId: wallet.tvm.chainId,
          blockchain: wallet.tvm.blockchain,
          address: wallet.tvm.address,
          type: wallet.tvm.type,
          supportedChainIds: wallet.tvm.supportedChainIds,
        }
      : null;
    await setLocalStorage(key, { latest, evm, svm, tvm });
    if (!evm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      });
    } else {
      const chainHex = `0x${evm.chainId.toString(16)}`;
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Evm,
        evm,
        evm.type === IWalletType.Safe ? evm.chainId : undefined,
      );
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
        data: { publicKey: evm.address } as IActiveWalletUpdate,
      });
      if (evm.type === IWalletType.Safe) {
        this.events.emit(BACKEND_EVENT, {
          name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
          data: { chainId: chainHex } as IChainIdUpdate,
        });
      }
    }
    if (!svm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_DISCONNECTED,
      });
    } else {
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Svm,
        svm,
      );
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
        data: { publicKey: svm.address } as IActiveWalletUpdate,
      });
    }
    if (!tvm) {
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_DISCONNECTED,
      });
    } else {
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Tvm,
        tvm,
      );
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_ACTIVE_WALLET_UPDATED,
        data: { publicKey: tvm.address } as IActiveWalletUpdate,
      });
    }
    return { latest, evm, svm, tvm } as SelectedWalletInfo;
  }

  public async setConnectedChainId(origin: string, chainId: number) {
    const connectedSite = await this.connectionService.getConnectedSite(origin);
    const chainHex = `0x${chainId.toString(16)}`;
    if (connectedSite && connectedSite.connections[IBlockchainType.Evm]) {
      await this.connectionService.addConnectedSite({
        origin,
        title: connectedSite.title,
        imageUrl: connectedSite.imageUrl,
        wallet: connectedSite.connections[IBlockchainType.Evm].wallet,
        chainId,
        blockchain: IBlockchainType.Evm,
      });
      this.events.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
        origin,
        data: { chainId: chainHex } as IChainIdUpdate,
      });
    }
  }

  public async getOAuthCode(
    oAuthProvider: IOAuthProvider,
  ): Promise<IOauthResponse> {
    const config = getOAuthProviderConfig(oAuthProvider);

    const client_id = config.clientId;
    const redirectUri = chrome.identity.getRedirectURL('oauth2');
    const scope = config.scopes.join('%20');
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const auth_url = `${config.discovery.authorizationEndpoint}?response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&client_id=${client_id}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: auth_url, interactive: true },
        async (callbackUri) => {
          if (chrome.runtime.lastError || !callbackUri) {
            reject(chrome.runtime.lastError);
          } else {
            const url = new URL(callbackUri);
            const queryParams = new URLSearchParams(url.search);
            const code = queryParams.get('code');
            const returnedState = queryParams.get('state');
            if (returnedState === state && code) {
              resolve({
                code,
                codeVerifier,
                redirectUri: redirectUri,
              });
            } else {
              reject(new Error('error connecting account'));
            }
          }
        },
      );
    });
  }
}
