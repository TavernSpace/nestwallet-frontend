import { NestWalletClientEvents } from '@nestwallet/app/common/api/nestwallet/types';
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
  Origin,
  Preferences,
  TokenDetailSettings,
  TradeSettings,
} from '@nestwallet/app/common/types';
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import messaging from '@react-native-firebase/messaging';
import { EventEmitter } from 'eventemitter3';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';
import { ConnectionService } from './connection-service';
import { SessionService } from './session-service';
import {
  AsyncJSONStorage,
  AsyncStorageKey,
  DeviceData,
  UserDeviceData,
  UserSessionData,
} from './storage';

export class UserService {
  private asyncStorage: AsyncJSONStorage;
  private eventEmitter: InstanceType<typeof EventEmitter<string>>;
  private connectionService: ConnectionService;
  private sessionService: SessionService;

  constructor(
    asyncStorage: AsyncJSONStorage,
    eventEmitter: InstanceType<typeof EventEmitter<string>>,
    connectionService: ConnectionService,
    sessionService: SessionService,
  ) {
    this.asyncStorage = asyncStorage;
    this.eventEmitter = eventEmitter;
    this.connectionService = connectionService;
    this.sessionService = sessionService;
  }

  /////////////////////////////////////////////////////////////////////////////
  // browser history
  /////////////////////////////////////////////////////////////////////////////

  public async addBrowserHistory(website: Origin) {
    const maxHistoryLength = 10;
    const data = await this.getUserSessionData();
    const browserHistory = data.browserHistory ?? [];
    const length = browserHistory.length - maxHistoryLength;
    const newHistory = browserHistory
      .filter((history) => history.url !== website.url)
      .slice(length > 0 ? length : 0);
    newHistory.push(website);
    await this.setUserSessionData({
      ...data,
      browserHistory: newHistory,
    });
  }

  public async deleteBrowserHistoryItem(website: Origin) {
    const data = await this.getUserSessionData();
    const browserHistory = data.browserHistory ?? [];
    const newHistory = browserHistory.filter(
      (history) => history.url !== website.url,
    );
    await this.setUserSessionData({
      ...data,
      browserHistory: newHistory,
    });
  }

  public async clearBrowserHistory() {
    const data = await this.getUserSessionData();
    await this.setUserSessionData({
      ...data,
      browserHistory: [],
    });
  }

  public async getBrowserHistory(): Promise<Origin[]> {
    const data = await this.getUserSessionData();
    return data.browserHistory ?? [];
  }

  /////////////////////////////////////////////////////////////////////////////
  // device
  /////////////////////////////////////////////////////////////////////////////

  public async getDeviceData(): Promise<DeviceData> {
    const key = AsyncStorageKey.DeviceData;
    const data = await this.asyncStorage.get(key);
    const defaultDeviceData = { hasShownNotificationPrompt: false };
    return data ?? defaultDeviceData;
  }

  public async setDeviceData(data: DeviceData): Promise<void> {
    const key = AsyncStorageKey.DeviceData;
    await this.asyncStorage.set(key, data);
  }

  public async getUserDeviceData(): Promise<UserDeviceData> {
    const userSessionData = await this.getUserSessionData();
    const userId = userSessionData.user.userId;

    const key = AsyncStorageKey.UserDeviceData;
    const userDeviceDataMap = (await this.asyncStorage.get(key)) ?? {};
    const defaultUserDeviceData = { isSetup: false, hasUserPassword: false };
    return userDeviceDataMap[userId] ?? defaultUserDeviceData;
  }

  public async setUserDeviceData(data: UserDeviceData): Promise<void> {
    const userSessionData = await this.getUserSessionData();
    const userId = userSessionData.user.userId;

    const key = AsyncStorageKey.UserDeviceData;
    const userDeviceDataMap = (await this.asyncStorage.get(key)) ?? {};
    userDeviceDataMap[userId] = data;
    await this.asyncStorage.set(key, userDeviceDataMap);
  }

  /////////////////////////////////////////////////////////////////////////////
  // notification
  /////////////////////////////////////////////////////////////////////////////

  public async requestNotificationPermission() {
    // https://github.com/invertase/react-native-firebase/issues/2031#issuecomment-1403048986
    if (Platform.OS === 'ios') {
      await messaging().requestPermission();
    } else if (Platform.OS === 'android') {
      await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
    }
  }

  public async shouldShowNotificationsPrompt(): Promise<boolean> {
    const data = await this.getDeviceData();
    // don't prompt anymore - if we prompted already
    if (data.hasShownNotificationPrompt) {
      return false;
    }
    const { canAskAgain } = await Notifications.getPermissionsAsync();
    return canAskAgain;
  }

  public async setHasShownNotificationPrompted(state: boolean) {
    const data = await this.getDeviceData();
    data.hasShownNotificationPrompt = state;
    await this.setDeviceData(data);
  }

  /////////////////////////////////////////////////////////////////////////////
  // branch
  /////////////////////////////////////////////////////////////////////////////

  public async setReferralCode(referralCode: string | null) {
    const data = await this.getDeviceData();
    data.referralCode = referralCode;
    await this.setDeviceData(data);
  }

  public async getReferralCode(): Promise<string | null> {
    const data = await this.getDeviceData();
    return data.referralCode ?? null;
  }

  /////////////////////////////////////////////////////////////////////////////
  // preferences
  /////////////////////////////////////////////////////////////////////////////

  public async getPreferences(): Promise<Preferences> {
    const key = AsyncStorageKey.PreferencesData;
    const data = await this.asyncStorage.get(key);
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

  public async setPreferences(data: Preferences): Promise<void> {
    const key = AsyncStorageKey.PreferencesData;
    await this.asyncStorage.set(key, data);
  }

  public async getTradeSettings(): Promise<TradeSettings> {
    const key = AsyncStorageKey.TradeSettingsData;
    const data = await this.asyncStorage.get(key);
    const defaultTradeSettingsData: TradeSettings = {
      slippage: {},
      defaultSecondaryAsset: {},
      customGas: {},
      tip: '100000',
      mev: false,
      infiniteApproval: true,
      simulate: true,
    };
    return !data
      ? defaultTradeSettingsData
      : { ...defaultTradeSettingsData, ...data };
  }

  public async setTradeSettings(data: TradeSettings): Promise<void> {
    const key = AsyncStorageKey.TradeSettingsData;
    await this.asyncStorage.set(key, data);
  }

  public async getTokenDetailSettings(): Promise<TokenDetailSettings> {
    const key = AsyncStorageKey.TokenDetailSettingsData;
    const data = await this.asyncStorage.get(key);
    const tokenSettingData: TokenDetailSettings = {
      chartType: 'candle',
    };
    return !data ? tokenSettingData : { ...tokenSettingData, ...data };
  }

  public async setTokenDetailSettings(
    data: TokenDetailSettings,
  ): Promise<void> {
    const key = AsyncStorageKey.TokenDetailSettingsData;
    await this.asyncStorage.set(key, data);
  }

  /////////////////////////////////////////////////////////////////////////////
  // wallet
  /////////////////////////////////////////////////////////////////////////////

  public async getSelectedWallet(): Promise<SelectedWalletInfo> {
    const data = await this.getUserSessionData();
    return {
      latest: data.selectedWallet ? JSON.parse(data.selectedWallet) : null,
      evm: data.selectedEvmWallet ? JSON.parse(data.selectedEvmWallet) : null,
      svm: data.selectedSvmWallet ? JSON.parse(data.selectedSvmWallet) : null,
      tvm: data.selectedTvmWallet ? JSON.parse(data.selectedTvmWallet) : null,
    };
  }

  public async setSelectedWallet(
    wallet: SelectedWalletInfo,
  ): Promise<SelectedWalletInfo> {
    const data = await this.getUserSessionData();
    if (!wallet.latest) {
      await this.setUserSessionData({
        ...data,
        selectedWallet: undefined,
        selectedEvmWallet: undefined,
        selectedSvmWallet: undefined,
        selectedTvmWallet: undefined,
      });
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      });
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_DISCONNECTED,
      });
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_DISCONNECTED,
      });
      return { latest: null, evm: null, svm: null, tvm: null };
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
    await this.setUserSessionData({
      ...data,
      selectedWallet: latest ? JSON.stringify(latest) : undefined,
      selectedEvmWallet: evm ? JSON.stringify(evm) : undefined,
      selectedSvmWallet: svm ? JSON.stringify(svm) : undefined,
      selectedTvmWallet: tvm ? JSON.stringify(tvm) : undefined,
    });
    if (!evm) {
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      });
    } else {
      const chainHex = `0x${evm.chainId.toString(16)}`;
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Evm,
        evm,
        evm.type === IWalletType.Safe ? evm.chainId : undefined,
      );
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
        data: { publicKey: evm.address } as IActiveWalletUpdate,
      });
      if (evm.type === IWalletType.Safe) {
        this.eventEmitter.emit(BACKEND_EVENT, {
          name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
          data: { chainId: chainHex } as IChainIdUpdate,
        });
        this.eventEmitter.emit(NestWalletClientEvents.ConnectedSiteChanged);
      }
    }
    if (!svm) {
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_DISCONNECTED,
      });
    } else {
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Svm,
        svm,
      );
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
        data: { publicKey: svm.address } as IActiveWalletUpdate,
      });
    }
    if (!tvm) {
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_DISCONNECTED,
      });
    } else {
      await this.connectionService.updateBlockchainWallets(
        IBlockchainType.Tvm,
        tvm,
      );
      this.eventEmitter.emit(BACKEND_EVENT, {
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
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
        origin,
        data: { chainId: chainHex } as IChainIdUpdate,
      });
      this.eventEmitter.emit(NestWalletClientEvents.ConnectedSiteChanged);
    }
  }

  public async connect(
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ) {
    const chainHex = `0x${chainId.toString(16)}`;
    const data = {
      publicKey: wallet.address,
      chainId: chainHex,
    } as IConnected;
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
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_ETHEREUM_CONNECTED,
        origin,
        data,
      });
    } else if (wallet.blockchain === IBlockchainType.Svm) {
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_SOLANA_CONNECTED,
        origin,
        data,
      });
    } else if (wallet.blockchain === IBlockchainType.Tvm) {
      this.eventEmitter.emit(BACKEND_EVENT, {
        name: NOTIFICATION_TON_CONNECTED,
        origin,
        data,
      });
    }
    this.eventEmitter.emit(NestWalletClientEvents.ConnectedSiteChanged);
    return data;
  }

  public async disconnect(origin: string): Promise<void> {
    await this.connectionService.removeConnectedSite(origin);
    // don't know if its evm or svm - just send to both
    this.eventEmitter.emit(BACKEND_EVENT, {
      name: NOTIFICATION_ETHEREUM_DISCONNECTED,
      origin,
    });
    this.eventEmitter.emit(BACKEND_EVENT, {
      name: NOTIFICATION_SOLANA_DISCONNECTED,
      origin,
    });
    this.eventEmitter.emit(BACKEND_EVENT, {
      name: NOTIFICATION_TON_DISCONNECTED,
      origin,
    });
    // TODO(TON): emit events
    this.eventEmitter.emit(NestWalletClientEvents.ConnectedSiteChanged);
  }

  /////////////////////////////////////////////////////////////////////////////
  // internal
  /////////////////////////////////////////////////////////////////////////////

  public async getUserSessionData(): Promise<UserSessionData> {
    return this.sessionService.getUserSessionData();
  }

  public async setUserSessionData(data: UserSessionData): Promise<void> {
    return this.sessionService.setUserSessionData(data);
  }
}
