import { NestWalletClient } from '@nestwallet/app/common/api/nestwallet/client';
import {
  IApprovalResponse,
  IKeyring,
  IPersonalWallet,
  KeyringsMetadata,
  UserData,
} from '@nestwallet/app/common/types';
import { onBlockchain } from '@nestwallet/app/features/chain';
import { MobileEthersSigner } from '@nestwallet/app/features/evm/ethers/mobile-signer';
import { AbstractEthersSigner } from '@nestwallet/app/features/evm/ethers/types';
import {
  KeyringServiceImpl,
  UserKeyrings,
} from '@nestwallet/app/features/keyring/service';
import { TypedData } from '@nestwallet/app/features/keyring/types';
import { MobileSvmSigner } from '@nestwallet/app/features/svm/signer/mobile-signer';
import { AbstractSvmSigner } from '@nestwallet/app/features/svm/signer/types';
import { MobileTvmSigner } from '@nestwallet/app/features/tvm/signer/mobile-signer';
import { AbstractTvmSigner } from '@nestwallet/app/features/tvm/signer/types';
import {
  IBlockchainType,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { CloudStorage, CloudStorageScope } from 'react-native-cloud-storage';
import Encryptor from './encryptor';
import { AsyncJSONStorage, AsyncStorageKey } from './storage';
import { UserService } from './user-service';
// eslint-disable-next-line import/namespace
import * as Keychain from 'react-native-keychain';
import { EthereumService } from './ethereum-service';
import { SolanaService } from './solana-service';
import { TonService } from './ton-service';

export type Keyrings = Record<string, IKeyring>;

export interface EncryptionMetadata {
  type: 'password' | 'passkey';
  credentialId?: string;
}

interface BackupPassword extends EncryptionMetadata {
  password: string;
}

interface KeyringsBackup {
  data: string;
  metadata: KeyringsMetadata;
  encryptionMetadata: EncryptionMetadata;
}

export class WalletService {
  private apiClient: NestWalletClient;
  private keyringImpl: KeyringServiceImpl;
  private encryptor: Encryptor;
  private ethereumService: EthereumService;
  private solanaService: SolanaService;
  private tonService: TonService;
  private userService: UserService;
  public readonly isLocked = false;
  private password: string | undefined;

  constructor(
    apiClient: NestWalletClient,
    asyncStorage: AsyncJSONStorage,
    ethereumService: EthereumService,
    solanaService: SolanaService,
    tonService: TonService,
    userSerivce: UserService,
  ) {
    this.apiClient = apiClient;
    this.encryptor = new Encryptor();
    this.ethereumService = ethereumService;
    this.solanaService = solanaService;
    this.tonService = tonService;
    this.userService = userSerivce;
    this.keyringImpl = new KeyringServiceImpl(this.encryptor, asyncStorage);
  }

  public async login(userData: UserData) {
    await this.userService.setUserSessionData({
      user: userData,
    });
    // if user do not have a keyring, create an empty keyring
    const hasKeyrings = await this.hasKeyrings();
    if (!hasKeyrings) {
      const userPassword = await this.createUserPassword();
      await this.keyringImpl.createKeyring(userData.userId, userPassword);
    }
  }

  public async logout() {
    const key = AsyncStorageKey.UserSessionData;
    this.lock();
    await AsyncStorage.removeItem(key);
  }

  public async getLocalToken(): Promise<string | null> {
    const key = AsyncStorageKey.LocalToken;
    return AsyncStorage.getItem(key);
  }

  public setLocalToken(token: string): Promise<void> {
    const key = AsyncStorageKey.LocalToken;
    return AsyncStorage.setItem(key, token);
  }

  public async shouldSetup() {
    const shouldShowNotificationPrompt =
      await this.userService.shouldShowNotificationsPrompt();
    const data = await this.userService.getUserDeviceData();
    return {
      isSetup: data.isSetup,
      shouldShowNotificationPrompt:
        !data.isSetup && shouldShowNotificationPrompt,
    };
  }

  public async isSetup() {
    const data = await this.userService.getUserDeviceData();
    return data.isSetup;
  }

  public async setIsSetup() {
    const data = await this.userService.getUserDeviceData();
    data.isSetup = true;
    await this.userService.setUserDeviceData(data);
  }

  /////////////////////////////////////////////////////////////////////////////
  // password
  /////////////////////////////////////////////////////////////////////////////

  private async getUserPasswordKey() {
    const userData = await this.userService.getUserSessionData();
    return `nestwallet-${userData.user.userId}-password`;
  }

  private async getAccessControlType() {
    const biometryType = await Keychain.getSupportedBiometryType();
    if (!biometryType) {
      return Keychain.ACCESS_CONTROL.DEVICE_PASSCODE;
    } else {
      return Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE;
    }
  }

  public lock() {
    this.password = undefined;
  }

  public async unlock() {
    const key = await this.getUserPasswordKey();
    const accessControl = await this.getAccessControlType();
    const result = await Keychain.getGenericPassword({
      service: key,
      accessControl,
    });
    if (result === false) {
      // should never get here
      throw new Error('failed to get user password');
    } else {
      const password = result.password;
      this.password = password;
    }
  }

  public generateSalt(byteCount: number): string {
    return this.encryptor.generateSalt(byteCount);
  }

  private async createUserPassword(): Promise<string> {
    const password = this.encryptor.generateSalt(64);
    const key = await this.getUserPasswordKey();
    const accessControl = await this.getAccessControlType();
    const result = await Keychain.setGenericPassword(key, password, {
      service: key,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      accessControl,
    });
    if (result === false) {
      // should never get here
      throw new Error('failed to set user password');
    }
    return password;
  }

  public async resetUserPassword() {
    const userSessionData = await this.userService.getUserSessionData();
    const key = await this.getUserPasswordKey();
    const reset = await Keychain.resetGenericPassword({ service: key });
    if (!reset) {
      throw new Error('failed to reset user password');
    }
    const password = await this.createUserPassword();
    await this.keyringImpl.resetKeyrings(userSessionData.user.userId, password);
  }

  public getUserPassword() {
    const password = this.password;
    if (!password) {
      throw new Error('Device is locked');
    } else {
      return password;
    }
  }

  public async getAutoLockTime() {
    const key = AsyncStorageKey.AutoLockTime;
    const value = await AsyncStorage.getItem(key);
    return value ? parseInt(value) : 1;
  }

  public async setAutoLockTime(duration: number) {
    const key = AsyncStorageKey.AutoLockTime;
    await AsyncStorage.setItem(key, duration.toString());
  }

  /////////////////////////////////////////////////////////////////////////////
  // backup
  /////////////////////////////////////////////////////////////////////////////

  // backup - we encrypt backup password with userPassword so we can
  // backup automatically

  // after login, if !hasKeyrings and hasBackupKeyring, will go into restore flow
  public async getBackupEncryptionMetadata(): Promise<
    EncryptionMetadata | undefined
  > {
    try {
      const filename = await this.getBackupKeyringFileName();
      const backupInfoJSON = await CloudStorage.readFile(
        filename,
        CloudStorageScope.AppData,
      );
      const backupInfo = JSON.parse(backupInfoJSON) as KeyringsBackup;
      return backupInfo.encryptionMetadata;
    } catch (err) {
      return undefined;
    }
  }

  public async isBackupEnabled(): Promise<boolean> {
    const data = await this.userService.getUserDeviceData();
    return !!data.encryptedBackupPassword;
  }

  public async enableBackup(backupPassword: BackupPassword): Promise<void> {
    const userPassword = this.getUserPassword();
    await this.setBackupPassword(userPassword, backupPassword);
    await this.backupKeyringWithUserPassword(userPassword);
  }

  public async restoreBackup(backupPassword: BackupPassword): Promise<void> {
    const filename = await this.getBackupKeyringFileName();
    const backupInfoJSON = await CloudStorage.readFile(
      filename,
      CloudStorageScope.AppData,
    );
    const backupInfo = JSON.parse(backupInfoJSON) as KeyringsBackup;
    const keyrings = await this.encryptor.decrypt<UserKeyrings>(
      backupPassword.password,
      backupInfo.data,
    );

    const userSessionData = await this.userService.getUserSessionData();
    const userPassword = this.getUserPassword();
    for (const keyring of Object.values(keyrings)) {
      await this.keyringImpl.createKeyring(
        userSessionData.user.userId,
        userPassword,
        keyring,
      );
    }
    // remember backup password for future use
    await this.setBackupPassword(userPassword, backupPassword);
  }

  private async getBackupKeyringFileName() {
    const userSessionData = await this.userService.getUserSessionData();
    return `/user_${userSessionData.user.userId}.nestwallet.backup`;
  }

  private async getBackupPassword(
    userPassword: string,
  ): Promise<BackupPassword> {
    const userDeviceData = await this.userService.getUserDeviceData();
    const encryptedPassword = userDeviceData.encryptedBackupPassword;
    if (!encryptedPassword) {
      throw new Error('cannot get backup password');
    }
    return this.encryptor.decrypt<BackupPassword>(
      userPassword,
      encryptedPassword,
    );
  }

  private async setBackupPassword(
    userPassword: string,
    backupPassword: BackupPassword,
  ): Promise<void> {
    const userDeviceData = await this.userService.getUserDeviceData();
    const encryptedBackupPassword = await this.encryptor.encrypt(
      userPassword,
      backupPassword,
    );
    userDeviceData.encryptedBackupPassword = encryptedBackupPassword;
    await this.userService.setUserDeviceData(userDeviceData);
  }

  private async backupKeyringWithUserPassword(
    userPassword: string,
  ): Promise<void> {
    const userData = await this.userService.getUserSessionData();
    const backupPassword = await this.getBackupPassword(userPassword);
    const keyrings = await this.getKeyrings(userPassword);
    const keyringsMetadata = await this.getUserKeyringsMetadata(
      userData.user.userId,
    );
    const filename = await this.getBackupKeyringFileName();
    const encryptedKeyrings = await this.encryptor.encrypt(
      backupPassword.password,
      keyrings,
    );
    const passwordFile = JSON.stringify({
      data: encryptedKeyrings,
      metadata: keyringsMetadata,
      encryptionMetadata: {
        type: backupPassword.type,
        credentialId: backupPassword.credentialId,
      },
    } as KeyringsBackup);
    await CloudStorage.writeFile(
      filename,
      passwordFile,
      CloudStorageScope.AppData,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // keyrings
  /////////////////////////////////////////////////////////////////////////////

  private async getKeyrings(userPassword: string): Promise<UserKeyrings> {
    const userSessionData = await this.userService.getUserSessionData();
    const keyrings = await this.keyringImpl.getUserKeyrings(
      userSessionData.user.userId,
      userPassword,
    );
    return keyrings;
  }

  public async hasKeyrings(): Promise<boolean> {
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.hasKeyrings(userSessionData.user.userId);
  }

  public async getUserKeyringsMetadata(
    userId: string,
  ): Promise<KeyringsMetadata> {
    return this.keyringImpl.getUserKeyringsMetadata(userId);
  }

  public async getKeyring(keyringIdentifier: string): Promise<IKeyring> {
    const userPassword = this.getUserPassword();
    const keyrings = await this.getKeyrings(userPassword);
    const value = keyrings[keyringIdentifier];
    if (!value) {
      throw new Error('Invalid keyring');
    }
    return value;
  }

  public async createKeyring(keyring: IKeyring): Promise<void> {
    const userSessionData = await this.userService.getUserSessionData();
    const userPassword = this.getUserPassword();

    await this.keyringImpl.createKeyring(
      userSessionData.user.userId,
      userPassword,
      keyring,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // IEvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signEvmMessage(
      userSessionData.user.userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signEvmTypedData(
    personalWallet: IPersonalWallet,
    message: TypedData,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signEvmTypedData(
      userSessionData.user.userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signEvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: ethers.PerformActionTransaction,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signEvmTransaction(
      userSessionData.user.userId,
      password,
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // ISvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signSvmMessage(
      userSessionData.user.userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signSvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signSvmTransaction(
      userSessionData.user.userId,
      password,
      personalWallet,
      transactions,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // ITvmSigner
  /////////////////////////////////////////////////////////////////////////////

  public async signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signTvmMessage(
      userSessionData.user.userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signTvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.signTvmTransaction(
      userSessionData.user.userId,
      password,
      personalWallet,
      transactions,
    );
  }

  public async getTvmPublicKey(personalWallet: IPersonalWallet) {
    const password = this.getUserPassword();
    const userSessionData = await this.userService.getUserSessionData();
    return this.keyringImpl.getPublicKey(
      userSessionData.user.userId,
      password,
      personalWallet,
      IBlockchainType.Tvm,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // IProtectedWalletClient functions
  /////////////////////////////////////////////////////////////////////////////

  public getEvmSigner(
    chainId: number,
    wallet: IWallet,
    usePrivateRPC = false,
    useMevProtect = false,
  ): Promise<AbstractEthersSigner> {
    const rpcOptions = usePrivateRPC
      ? { apiClient: this.apiClient, mevProtection: useMevProtect }
      : undefined;
    return Promise.resolve(
      new MobileEthersSigner(this, chainId, wallet, rpcOptions),
    );
  }

  public getSvmSigner(
    chainId: number,
    wallet: IWallet,
  ): Promise<AbstractSvmSigner> {
    return Promise.resolve(new MobileSvmSigner(this, wallet));
  }

  public getTvmSigner(
    chainId: number,
    wallet: IWallet,
  ): Promise<AbstractTvmSigner> {
    return Promise.resolve(new MobileTvmSigner(this, wallet));
  }

  public async resolveApproval(input: IApprovalResponse) {
    return onBlockchain(input.blockchain)(
      () => this.ethereumService.resolveApproval(input),
      () => this.solanaService.resolveApproval(input),
      () => this.tonService.resolveApproval(input),
    );
  }
}
