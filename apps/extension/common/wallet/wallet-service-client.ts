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
import { TypedData } from '@nestwallet/app/features/keyring/types';
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import { IOAuthProvider } from '@nestwallet/app/graphql/client/generated/graphql';
import { ethers } from 'ethers';
import {
  PopupChannelClient,
  PopupServiceChannel,
} from '../channel/popup-channel';
import {
  IConnectionResponse,
  IExtWalletService,
  IOauthResponse,
  WalletServiceMethods,
} from './interface';

export class WalletServiceClient implements IExtWalletService {
  private channel: PopupChannelClient;

  constructor() {
    this.channel = PopupServiceChannel.client(CHANNEL_APP_RPC_REQUEST);
  }

  // WalletService functions

  public login(input: UserData): Promise<void> {
    return this.request('login', input);
  }

  public logout(): Promise<void> {
    localStorage.clear();
    return this.request('logout');
  }

  public getDeviceId(): Promise<string | undefined> {
    return this.request('getDeviceId');
  }

  public getPreferences(): Promise<Preferences> {
    return this.request('getPreferences');
  }

  public setPreferences(preferences: Preferences): Promise<void> {
    return this.request('setPreferences', preferences);
  }

  public getTradeSettings(): Promise<TradeSettings> {
    return this.request('getTradeSettings');
  }

  public setTradeSettings(settings: TradeSettings): Promise<void> {
    return this.request('setTradeSettings', settings);
  }

  public getTokenDetailSettings(): Promise<TokenDetailSettings> {
    return this.request('getTokenDetailSettings');
  }

  public setTokenDetailSettings(settings: TokenDetailSettings): Promise<void> {
    return this.request('setTokenDetailSettings', settings);
  }

  public getUserData(): Promise<UserData> {
    return this.request('getUserData');
  }

  public getLocalToken(): Promise<string | null> {
    return this.request('getLocalToken');
  }

  public setLocalToken(token: string): Promise<void> {
    return this.request('setLocalToken', token);
  }

  public getSelectedWallet(): Promise<SelectedWalletInfo> {
    return this.request('getSelectedWallet');
  }

  public getSettingsModified(): Promise<boolean> {
    return this.request('getSettingsModified');
  }

  public setSettingsModified(): Promise<void> {
    return this.request('setSettingsModified');
  }

  public setSelectedWallet(
    wallet: SelectedWalletInfo,
  ): Promise<SelectedWalletInfo> {
    return this.request('setSelectedWallet', wallet);
  }

  public setConnectedChainId(origin: string, chainId: number): Promise<void> {
    return this.request('setConnectedChainId', origin, chainId);
  }

  public connect(
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ): Promise<IConnectionResponse> {
    return this.request('connect', origin, title, imageUrl, chainId, wallet);
  }

  public disconnect(origin: string): Promise<void> {
    return this.request('disconnect', origin);
  }

  public disconnectAll(): Promise<void> {
    return this.request('disconnectAll');
  }

  public async getConnectedSites(): Promise<ConnectedSitesData> {
    return this.request('getConnectedSites');
  }

  public async getConnectedSite(): Promise<ConnectedSite> {
    return this.request('getConnectedSite');
  }

  public resolveApproval(input: IApprovalResponse): Promise<void> {
    return this.request('resolveApproval', input);
  }

  public async getOAuthCode(
    oAuthProvider: IOAuthProvider,
  ): Promise<IOauthResponse> {
    return this.request('getOAuthCode', oAuthProvider);
  }

  public async isLocked(): Promise<boolean> {
    return this.request('isLocked');
  }

  public async lock(): Promise<void> {
    return this.request('lock');
  }

  public async unlock(password: string, epheremal: boolean): Promise<void> {
    return this.request('unlock', password, epheremal);
  }

  public async setAutoLockTime(minutes: number): Promise<void> {
    return this.request('setAutoLockTime', minutes);
  }

  public async getAutoLockTime(): Promise<number> {
    return this.request('getAutoLockTime');
  }

  public async resetAutoLockTimer(): Promise<void> {
    return this.request('resetAutoLockTimer');
  }

  public async getPassword(): Promise<string | undefined> {
    return this.request('getPassword');
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    return this.request('changePassword', currentPassword, newPassword);
  }

  public async resetPassword(password: string): Promise<void> {
    return this.request('resetPassword', password);
  }

  public async hasKeyrings(): Promise<boolean> {
    return this.request('hasKeyrings');
  }

  public async getKeyringsMetadata(): Promise<KeyringsMetadata> {
    return this.request('getKeyringsMetadata');
  }

  public async getKeyring(keyringIdentifier: string): Promise<IKeyring> {
    return this.request('getKeyring', keyringIdentifier);
  }

  public async createKeyring(keyring: IKeyring): Promise<void> {
    return this.request('createKeyring', keyring);
  }

  public async resetKeyrings(): Promise<void> {
    return this.request('resetKeyrings');
  }

  public async signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string> {
    return this.request('signEvmMessage', personalWallet, message);
  }

  public async signEvmTypedDataString(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string> {
    return this.request('signEvmTypedDataString', personalWallet, message);
  }

  public async signEvmTransactionString(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string> {
    return this.request(
      'signEvmTransactionString',
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // IEvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signEvmTypedData(
    personalWallet: IPersonalWallet,
    typedData: TypedData,
  ): Promise<string> {
    return this.signEvmTypedDataString(
      personalWallet,
      JSON.stringify(typedData),
    );
  }

  public async signEvmTransaction(
    personalWallet: IPersonalWallet,
    txRequest: ethers.PerformActionTransaction,
  ): Promise<string> {
    const serializedTx = ethers.Transaction.from(txRequest).unsignedSerialized;
    return this.signEvmTransactionString(personalWallet, serializedTx);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ISvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string> {
    return this.request('signSvmMessage', personalWallet, message);
  }

  public async signSvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string> {
    return this.request('signSvmTransaction', personalWallet, transactions);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ITvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string> {
    return this.request('signTvmMessage', personalWallet, message);
  }

  public async signTvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string> {
    return this.request('signTvmTransaction', personalWallet, transactions);
  }

  public async getTvmPublicKey(
    personalWallet: IPersonalWallet,
  ): Promise<string> {
    return this.request('getTvmPublicKey', personalWallet);
  }

  /////////////////////////////////////////////////////////////////////////////
  // private
  /////////////////////////////////////////////////////////////////////////////

  private request<
    TMethod extends WalletServiceMethods,
    TReturn extends ReturnType<IExtWalletService[TMethod]>,
  >(
    method: TMethod,
    ...params: Parameters<IExtWalletService[TMethod]>
  ): Promise<Awaited<TReturn>> {
    return this.channel.request({
      method,
      params,
    });
  }
}
