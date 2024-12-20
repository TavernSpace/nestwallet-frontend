import { CHANNEL_APP_RPC_REQUEST } from '@nestwallet/app/common/constants';
import {
  ConnectedSite,
  ConnectedSitesData,
  IApprovalResponse,
  IKeyring,
  IPersonalWallet,
  KeyringsMetadata,
  Preferences,
  TokenDetailSettings,
  TradeSettings,
  UserData,
} from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import {
  IBlockchainType,
  IOAuthProvider,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { browser } from 'webextension-polyfill-ts';
import { PopupServiceChannel } from '../../common/channel/popup-channel';
import { BackgroundStorageKey } from '../../common/constants/worker/storage';
import { getLogger } from '../../common/logger';
import { getLocalStorage, setLocalStorage } from '../../common/storage';
import { RequestContext, RpcResponse } from '../../common/types';
import {
  IExtWalletService,
  IOauthResponse,
  WalletServiceMethods,
} from '../../common/wallet/interface';
import { ApprovalService } from './approval-service';
import { ConnectionService } from './connection-service';
import { KeyringService } from './keyring/service';
import { UserService } from './user-service';
import { withRequestContext } from './utils';

const logger = getLogger('background', 'ui-service');

export class WalletService implements IExtWalletService {
  private approvalService: ApprovalService;
  private connectionService: ConnectionService;
  private keyringService: KeyringService;
  private userService: UserService;

  constructor(
    approvalService: ApprovalService,
    connectionService: ConnectionService,
    keyringService: KeyringService,
    walletService: UserService,
  ) {
    this.approvalService = approvalService;
    this.connectionService = connectionService;
    this.keyringService = keyringService;
    this.userService = walletService;
  }

  public start() {
    const channelAppRequest = PopupServiceChannel.server(
      CHANNEL_APP_RPC_REQUEST,
    );
    channelAppRequest.handler(withRequestContext(this.handle.bind(this)));
  }

  public async handle(ctx: RequestContext): Promise<RpcResponse> {
    logger.debug(`handle ${ctx.request.method}`, ctx.request);
    const method: WalletServiceMethods = ctx.request
      .method as WalletServiceMethods;
    const params = ctx.request.params as any;
    switch (method) {
      case 'login':
        return await this.login.apply(this, params);
      case 'logout':
        return await this.logout.apply(this, params);
      case 'getDeviceId':
        return await this.getDeviceId.apply(this, params);
      case 'getPreferences':
        return await this.getPreferences.apply(this, params);
      case 'setPreferences':
        return await this.setPreferences.apply(this, params);
      case 'getTradeSettings':
        return await this.getTradeSettings.apply(this, params);
      case 'setTradeSettings':
        return await this.setTradeSettings.apply(this, params);
      case 'getTokenDetailSettings':
        return await this.getTokenDetailSettings.apply(this, params);
      case 'setTokenDetailSettings':
        return await this.setTokenDetailSettings.apply(this, params);
      case 'getUserData':
        return await this.getUserData.apply(this, params);
      case 'getLocalToken':
        return await this.getLocalToken.apply(this, params);
      case 'setLocalToken':
        return await this.setLocalToken.apply(this, params);
      case 'getSettingsModified':
        return await this.getSettingsModified.apply(this, params);
      case 'setSettingsModified':
        return await this.setSettingsModified.apply(this, params);
      case 'getSelectedWallet':
        return await this.getSelectedWallet.apply(this, params);
      case 'setSelectedWallet':
        return await this.setSelectedWallet.apply(this, params);
      case 'setConnectedChainId':
        return await this.setConnectedChainId.apply(this, params);
      case 'connect':
        return await this.connect.apply(this, params);
      case 'disconnect':
        return await this.disconnect.apply(this, params);
      case 'disconnectAll':
        return await this.disconnectAll.apply(this, params);
      case 'resolveApproval':
        return await this.resolveApproval.apply(this, params);
      case 'getConnectedSites':
        return await this.getConnectedSites.apply(this, params);
      case 'getConnectedSite':
        return await this.getConnectedSite.apply(this, params);
      case 'isLocked':
        return await this.isLocked.apply(this, params);
      case 'getOAuthCode':
        return await this.getOAuthCode.apply(this, params);
      case 'lock':
        return await this.lock.apply(this, params);
      case 'unlock':
        return await this.unlock.apply(this, params);
      case 'setAutoLockTime':
        return await this.setAutoLockTime.apply(this, params);
      case 'getAutoLockTime':
        return await this.getAutoLockTime.apply(this, params);
      case 'resetAutoLockTimer':
        return await this.resetAutoLockTimer.apply(this, params);
      case 'getPassword':
        return await this.getPassword.apply(this, params);
      case 'resetPassword':
        return await this.resetPassword.apply(this, params);
      case 'changePassword':
        return await this.changePassword.apply(this, params);
      case 'getKeyringsMetadata':
        return await this.getKeyringsMetadata.apply(this, params);
      case 'getKeyring':
        return await this.getKeyring.apply(this, params);
      case 'hasKeyrings':
        return await this.hasKeyrings.apply(this, params);
      case 'createKeyring':
        return await this.createKeyring.apply(this, params);
      case 'resetKeyrings':
        return await this.resetKeyrings.apply(this, params);
      case 'signEvmMessage':
        return await this.signEvmMessage.apply(this, params);
      case 'signEvmTypedDataString':
        return await this.signEvmTypedDataString.apply(this, params);
      case 'signEvmTransactionString':
        return await this.signEvmTransactionString.apply(this, params);
      case 'signSvmMessage':
        return await this.signSvmMessage.apply(this, params);
      case 'signSvmTransaction':
        return await this.signSvmTransaction.apply(this, params);
      case 'signTvmMessage':
        return await this.signTvmMessage.apply(this, params);
      case 'signTvmTransaction':
        return await this.signTvmTransaction.apply(this, params);
      case 'getTvmPublicKey':
        return await this.getTvmPublicKey.apply(this, params);
      default:
        throw new Error(`invalid method=${method}`);
    }
  }

  public async login(input: UserData): Promise<void> {
    return this.userService.setUserData(input);
  }

  public async logout(): Promise<void> {
    await Promise.all([
      this.userService.setUserData(undefined),
      this.userService.setSelectedWallet({
        latest: null,
        evm: null,
        svm: null,
        tvm: null,
      }),
      this.keyringService.lock(),
    ]);
  }

  public async getDeviceId(): Promise<string | undefined> {
    return this.userService.getDeviceId();
  }

  public async getPreferences(): Promise<Preferences> {
    return this.userService.getPreferences();
  }

  public async setPreferences(preferences: Preferences): Promise<void> {
    return this.userService.setPreferences(preferences);
  }

  public async getTradeSettings(): Promise<TradeSettings> {
    return this.userService.getTradeSettings();
  }

  public async setTradeSettings(settings: TradeSettings): Promise<void> {
    return this.userService.setTradeSettings(settings);
  }

  public async getTokenDetailSettings(): Promise<TokenDetailSettings> {
    return this.userService.getTokenDetailSettings();
  }

  public async setTokenDetailSettings(
    settings: TokenDetailSettings,
  ): Promise<void> {
    return this.userService.setTokenDetailSettings(settings);
  }

  public async getUserData(): Promise<UserData> {
    return this.userService.getUserData();
  }

  public async getLocalToken(): Promise<string | null> {
    const key = BackgroundStorageKey.LocalToken;
    const token = await getLocalStorage(key);
    return token ?? null;
  }

  public async setLocalToken(token: string): Promise<void> {
    const key = BackgroundStorageKey.LocalToken;
    await setLocalStorage(key, token);
  }

  public async getSettingsModified(): Promise<boolean> {
    const key = BackgroundStorageKey.SettingsModified;
    const modified = await getLocalStorage(key);
    return modified ?? false;
  }

  public async setSettingsModified(): Promise<void> {
    const key = BackgroundStorageKey.SettingsModified;
    await setLocalStorage(key, true);
  }

  public async getSelectedWallet(): Promise<SelectedWalletInfo> {
    return this.userService.getSelectedWallet();
  }

  public async setSelectedWallet(
    wallet: SelectedWalletInfo,
  ): Promise<SelectedWalletInfo> {
    return this.userService.setSelectedWallet(wallet);
  }

  public async setConnectedChainId(
    origin: string,
    chainId: number,
  ): Promise<void> {
    return this.userService.setConnectedChainId(origin, chainId);
  }

  public async connect(
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ) {
    return this.userService.connect(origin, title, imageUrl, chainId, wallet);
  }

  public async disconnect(origin: string) {
    return this.userService.disconnect(origin);
  }

  public async disconnectAll() {
    return this.userService.disconnectAll();
  }

  public async resolveApproval(input: IApprovalResponse): Promise<void> {
    const { requestId, tabId, result, blockchain, error } = input;
    logger.debug('handle popup ui response', result, error);
    this.approvalService.resolveApproval(
      requestId,
      tabId,
      result,
      blockchain,
      error,
    );
  }

  public async getConnectedSites(): Promise<ConnectedSitesData> {
    return this.connectionService.getConnectedSites();
  }

  public async getConnectedSite(): Promise<ConnectedSite> {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tabUrl = activeTab?.pendingUrl || activeTab?.url;
    if (!tabUrl) {
      return { connections: {} };
    }
    const url = new URL(tabUrl);
    const origin = url.origin;
    const connectedSite = await this.connectionService.getConnectedSite(origin);
    return {
      connections: connectedSite ? connectedSite.connections : {},
      siteInfo: {
        url: origin,
        origin,
        title: connectedSite?.title || activeTab.title || url.hostname,
        imageUrl: connectedSite?.imageUrl || getOriginIcon(origin),
      },
    };
  }

  public getOAuthCode(oAuthProvider: IOAuthProvider): Promise<IOauthResponse> {
    return this.userService.getOAuthCode(oAuthProvider);
  }

  public async isLocked(): Promise<boolean> {
    return this.keyringService.isLocked();
  }

  public async lock(): Promise<void> {
    return this.keyringService.lock();
  }

  public async unlock(password: string, ephemeral: boolean): Promise<void> {
    const userData = await this.userService.getUserData();
    await this.keyringService.unlock(userData.userId, password, ephemeral);
  }

  public async setAutoLockTime(minutes: number): Promise<void> {
    return this.keyringService.setAutoLockTime(minutes);
  }

  public async getAutoLockTime(): Promise<number> {
    return this.keyringService.getAutoLockTime();
  }

  public async resetAutoLockTimer() {
    return this.keyringService.resetAutoLockTimer();
  }

  public async getPassword(): Promise<string | undefined> {
    return this.keyringService.getPassword();
  }

  public async resetPassword(password: string): Promise<void> {
    const userData = await this.userService.getUserData();
    return this.keyringService.resetPassword(userData.userId, password);
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const userData = await this.userService.getUserData();
    return this.keyringService.changePassword(
      userData.userId,
      currentPassword,
      newPassword,
    );
  }

  public async hasKeyrings(): Promise<boolean> {
    const userData = await this.userService.getUserData();
    return this.keyringService.hasKeyrings(userData.userId);
  }

  public async getKeyringsMetadata(): Promise<KeyringsMetadata> {
    const userData = await this.userService.getUserData();
    return this.keyringService.getUserKeyringsMetadata(userData.userId);
  }

  public async getKeyring(keyringIdentifier: string): Promise<IKeyring> {
    const userData = await this.userService.getUserData();
    return this.keyringService.getKeyring(userData.userId, keyringIdentifier);
  }

  public async createKeyring(keyring: IKeyring): Promise<void> {
    const userData = await this.userService.getUserData();
    return this.keyringService.createKeyring(userData.userId, keyring);
  }

  public async resetKeyrings(): Promise<void> {
    const userData = await this.userService.getUserData();
    return this.keyringService.resetKeyrings(userData.userId);
  }

  public async signEvmMessage(
    personalWallet: IPersonalWallet,
    message: Uint8Array | string,
  ) {
    const userData = await this.userService.getUserData();
    return this.keyringService.signEvmMessage(
      userData.userId,
      personalWallet,
      message,
    );
  }

  public async signEvmTypedDataString(
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    const userData = await this.userService.getUserData();
    return this.keyringService.signEvmTypedData(
      userData.userId,
      personalWallet,
      JSON.parse(message),
    );
  }

  public async signEvmTransactionString(
    personalWallet: IPersonalWallet,
    tx: string,
  ) {
    const userData = await this.userService.getUserData();
    return this.keyringService.signEvmTransaction(
      userData.userId,
      personalWallet,
      tx,
    );
  }

  public async signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string> {
    const userData = await this.userService.getUserData();
    return this.keyringService.signSvmMessage(
      userData.userId,
      personalWallet,
      message,
    );
  }

  public async signSvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string> {
    const userData = await this.userService.getUserData();
    return this.keyringService.signSvmTransaction(
      userData.userId,
      personalWallet,
      transaction,
    );
  }

  public async signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string> {
    const userData = await this.userService.getUserData();
    return this.keyringService.signTvmMessage(
      userData.userId,
      personalWallet,
      message,
    );
  }

  public async signTvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string> {
    const userData = await this.userService.getUserData();
    return this.keyringService.signTvmTransaction(
      userData.userId,
      personalWallet,
      transaction,
    );
  }

  public async getTvmPublicKey(personalWallet: IPersonalWallet) {
    const userData = await this.userService.getUserData();
    return this.keyringService.getPublicKey(
      userData.userId,
      personalWallet,
      IBlockchainType.Tvm,
    );
  }
}
