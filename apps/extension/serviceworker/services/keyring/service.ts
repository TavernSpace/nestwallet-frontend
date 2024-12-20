import { decrypt, encrypt } from '@metamask/browser-passworder';
import {
  IKeyring,
  IPersonalWallet,
  KeyringsMetadata,
} from '@nestwallet/app/common/types';
import { KeyringServiceImpl } from '@nestwallet/app/features/keyring/service';
import { TypedData } from '@nestwallet/app/features/keyring/types';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ethers } from 'ethers';
import { getLocalStorage, setLocalStorage } from '../../../common/storage';
import { TimeLockedStore } from './store';

export class KeyringService {
  // passwordStore unlocked => ephemeralPassword exists but not the other way around
  // ephemeralPassword is used for in app operations, passwordStore represents the
  // lock status of the app
  private ephemeralPassword?: string;
  private passwordStore: TimeLockedStore<string>;
  private keyringImpl: KeyringServiceImpl;

  constructor() {
    const encryptor = {
      encrypt,
      decrypt,
    };
    const storage = {
      get: getLocalStorage,
      set: setLocalStorage,
    };
    this.passwordStore = new TimeLockedStore<string>();
    this.keyringImpl = new KeyringServiceImpl(encryptor, storage);
  }

  public isLocked() {
    return this.passwordStore.isLocked();
  }

  public async lock() {
    await this.passwordStore.lock();
    this.ephemeralPassword = undefined;
  }

  public async unlock(userId: string, password: string, ephemeral: boolean) {
    // see if password is correct by trying to unlock keyring
    await this.keyringImpl.getUserKeyrings(userId, password);
    if (!ephemeral) {
      await this.passwordStore.setData(password);
    }
    this.ephemeralPassword = password;
  }

  public async setAutoLockTime(minutes: number): Promise<void> {
    return this.passwordStore.setMinutesUntilAutoLock(minutes);
  }

  public async getAutoLockTime(): Promise<number> {
    return this.passwordStore.getMinutesUntilAutoLock();
  }

  public async resetAutoLockTimer() {
    return this.passwordStore.restartTimer();
  }

  public async getPassword() {
    const isLocked = await this.isLocked();
    return isLocked
      ? undefined
      : this.passwordStore.getData().catch(() => undefined);
  }

  public async resetPassword(userId: string, password: string) {
    await this.keyringImpl.resetKeyrings(userId, password);
    await this.passwordStore.setData(password);
    this.ephemeralPassword = password;
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    await this.keyringImpl.changePassword(userId, currentPassword, newPassword);
    await this.passwordStore.setData(newPassword);
    this.ephemeralPassword = newPassword;
  }

  public async hasKeyrings(userId: string): Promise<boolean> {
    return this.keyringImpl.hasKeyrings(userId);
  }

  public async getUserKeyringsMetadata(
    userId: string,
  ): Promise<KeyringsMetadata> {
    return this.keyringImpl.getUserKeyringsMetadata(userId);
  }

  public async getKeyring(
    userId: string,
    keyringIdentifier: string,
  ): Promise<IKeyring> {
    const password = await this.getEphemeralPassword();
    const keyrings = await this.keyringImpl.getUserKeyrings(userId, password);
    const value = keyrings[keyringIdentifier];
    if (!value) {
      throw new Error('Invalid keyring');
    }
    return value;
  }

  public async createKeyring(userId: string, keyring: IKeyring): Promise<void> {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.createKeyring(userId, password, keyring);
  }

  public async resetKeyrings(userId: string): Promise<void> {
    await this.passwordStore.lock();
    this.ephemeralPassword = undefined;
    return this.keyringImpl.deleteKeyrings(userId);
  }

  public async getPublicKey(
    userId: string,
    personalWallet: IPersonalWallet,
    blockchain: IBlockchainType,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.getPublicKey(
      userId,
      password,
      personalWallet,
      blockchain,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // evm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signEvmMessage(
    userId: string,
    personalWallet: IPersonalWallet,
    message: Uint8Array | string,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signEvmMessage(
      userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signEvmTypedData(
    userId: string,
    personalWallet: IPersonalWallet,
    message: TypedData,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signEvmTypedData(
      userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signEvmTransaction(
    userId: string,
    personalWallet: IPersonalWallet,
    tx: string,
  ) {
    const password = await this.getEphemeralPassword();
    const transaction = ethers.Transaction.from(tx);
    return this.keyringImpl.signEvmTransaction(
      userId,
      password,
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // svm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signSvmMessage(
    userId: string,
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signSvmMessage(
      userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signSvmTransaction(
    userId: string,
    personalWallet: IPersonalWallet,
    tx: string,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signSvmTransaction(
      userId,
      password,
      personalWallet,
      tx,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // tvm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signTvmMessage(
    userId: string,
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signTvmMessage(
      userId,
      password,
      personalWallet,
      message,
    );
  }

  public async signTvmTransaction(
    userId: string,
    personalWallet: IPersonalWallet,
    tx: string,
  ) {
    const password = await this.getEphemeralPassword();
    return this.keyringImpl.signTvmTransaction(
      userId,
      password,
      personalWallet,
      tx,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // private functions
  /////////////////////////////////////////////////////////////////////////////

  private async getEphemeralPassword() {
    if (this.ephemeralPassword) {
      return this.ephemeralPassword;
    } else {
      const password = await this.passwordStore.getData();
      this.ephemeralPassword = password;
      return password;
    }
  }
}
