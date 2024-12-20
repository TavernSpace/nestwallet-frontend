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
import {
  IWalletInfo,
  SelectedWalletInfo,
} from '@nestwallet/app/features/wallet/service/interface';
import { IOAuthProvider } from '@nestwallet/app/graphql/client/generated/graphql';

export interface IConnectionResponse {
  publicKey?: string;
  connectionUrl?: string;
  chainId: string;
}

export interface IOauthResponse {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface IExtWalletService {
  login(input: UserData): Promise<void>;

  logout(): Promise<void>;

  getDeviceId(): Promise<string | undefined>;

  getPreferences(): Promise<Preferences>;

  setPreferences(preferences: Preferences): Promise<void>;

  getTradeSettings(): Promise<TradeSettings>;

  setTradeSettings(settings: TradeSettings): Promise<void>;

  getTokenDetailSettings(): Promise<TokenDetailSettings>;

  setTokenDetailSettings(settings: TokenDetailSettings): Promise<void>;

  getUserData(): Promise<UserData>;

  getLocalToken(): Promise<string | null>;

  setLocalToken(token: string): Promise<void>;

  getSettingsModified(): Promise<boolean>;

  setSettingsModified(): Promise<void>;

  // dapp interactions

  connect(
    origin: string,
    title: string,
    imageUrl: string,
    chainId: number,
    wallet: IWalletInfo,
  ): Promise<IConnectionResponse>;

  disconnect(origin: string): Promise<void>;

  disconnectAll(): Promise<void>;

  getConnectedSite(): Promise<ConnectedSite>;

  getConnectedSites(): Promise<ConnectedSitesData>;

  getSelectedWallet(): Promise<SelectedWalletInfo>;

  setSelectedWallet(input: SelectedWalletInfo): Promise<SelectedWalletInfo>;

  setConnectedChainId(origin: string, chainId: number): Promise<void>;

  resolveApproval(input: IApprovalResponse): Promise<void>;

  getOAuthCode(oAuthProvider: IOAuthProvider): Promise<IOauthResponse>;

  // keyring related

  isLocked(): Promise<boolean>;

  lock(): Promise<void>;

  unlock(password: string, ephemeral: boolean): Promise<void>;

  getAutoLockTime(): Promise<number>;

  setAutoLockTime(time: number): Promise<void>;

  resetAutoLockTimer(): Promise<void>;

  getPassword(): Promise<string | undefined>;

  changePassword(currentPassword: string, newPassword: string): Promise<void>;

  resetPassword(password: string): Promise<void>;

  hasKeyrings(): Promise<boolean>;

  getKeyringsMetadata(): Promise<KeyringsMetadata>;

  getKeyring(keyringIdentifier: string): Promise<IKeyring>;

  createKeyring(keyring: IKeyring): Promise<void>;

  resetKeyrings(): Promise<void>;

  signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string>;

  signEvmTypedDataString(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string>;

  signEvmTransactionString(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string>;

  signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string>;

  signSvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string>;

  signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string>;

  signTvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string>;

  getTvmPublicKey(personalWallet: IPersonalWallet): Promise<string>;
}

export type WalletServiceMethods = keyof IExtWalletService;
