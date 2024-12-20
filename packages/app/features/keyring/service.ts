import {
  IKeyring,
  IPersonalWallet,
  KeyringsMetadata,
} from '@nestwallet/app/common/types';
import { Keypair } from '@solana/web3.js';
import { decode } from 'bs58';
import { ethers, SigningKey } from 'ethers';
import nacl from 'tweetnacl';
import {
  IBlockchainType,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { onBlockchain } from '../chain';
import {
  createEvmWalletFromSeed,
  createSvmKeypairFromSeed,
  createTvmKeypairFromSeed,
} from '../wallet/seedphrase';
import {
  signEvmMessageWithKeystore,
  signEvmTransactionWithKeystore,
  signEvmTypedDataWithKeystore,
} from './evm';
import {
  signSvmMessageWithKeystore,
  signSvmTransactionWithKeystore,
} from './svm';
import {
  signTvmMessageWithKeystore,
  signTvmTransactionWithKeystore,
} from './tvm';
import { IEncryptor, IStorage, TypedData } from './types';

export enum StorageKey {
  Keyrings = 'keyrings',
  KeyringsMetadata = 'keyrings_metadata',
}

type EncryptedKeyrings = Record<string, string>;
export type UserKeyrings = Record<string, IKeyring>;
type AllKeyringsMetadata = Record<string, KeyringsMetadata>;

export class KeyringServiceImpl {
  private encryptor: IEncryptor;
  private storage: IStorage;

  constructor(encryptor: IEncryptor, storage: IStorage) {
    this.encryptor = encryptor;
    this.storage = storage;
  }

  public async hasKeyrings(userId: string): Promise<boolean> {
    const allKeyrings = await this.getEncryptedKeyrings();
    const keyringForUser = allKeyrings[userId];
    return !!keyringForUser;
  }

  public async getUserKeyrings(
    userId: string,
    password: string,
  ): Promise<UserKeyrings> {
    const allKeyrings = await this.getEncryptedKeyrings();
    const keyringForUser = allKeyrings[userId];
    if (!keyringForUser) {
      return {};
    }
    const decryptedKeyring = await this.encryptor.decrypt(
      password,
      keyringForUser,
    );
    return decryptedKeyring as UserKeyrings;
  }

  public async createKeyring(
    userId: string,
    password: string,
    keyring?: IKeyring,
  ): Promise<void> {
    const userKeyrings = await this.getUserKeyrings(userId, password);
    if (keyring) {
      const oldKeyring = userKeyrings[keyring.keyringIdentifier];
      // TODO: this doesn't handle the edge case where:
      // 1. user enters seed phrase on extension
      // 2. user enters private key on mobile
      // 3. imports extension, then mobile
      // Need backend validation for this?
      if (oldKeyring && oldKeyring.type !== keyring.type) {
        throw new Error(
          `Wallet was previously imported with a ${
            oldKeyring.type === IWalletType.PrivateKey
              ? 'private key'
              : 'seed phrase'
          }.`,
        );
      }
      userKeyrings[keyring.keyringIdentifier] = keyring;
    }
    return this.setUserKeyrings(userId, password, userKeyrings);
  }

  public async deleteKeyrings(userId: string) {
    return this.deleteUserKeyrings(userId);
  }

  public async resetKeyrings(userId: string, password: string) {
    await this.setUserKeyringsMetadata(userId, {});
    return this.setUserKeyrings(userId, password, {});
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const currentKeyrings = await this.getUserKeyrings(userId, currentPassword);
    return this.setUserKeyrings(userId, newPassword, currentKeyrings);
  }

  public async getPublicKey(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    blockchain: IBlockchainType,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    const keyring = keyrings[personalWallet.keyringIdentifier];
    if (!keyring) {
      throw new Error(
        `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
      );
    }
    if (keyring.type === IWalletType.SeedPhrase) {
      return onBlockchain(blockchain)(
        async () => {
          const wallet = await createEvmWalletFromSeed(
            keyring.value,
            personalWallet.derivationPath,
          );
          return wallet.publicKey;
        },
        async () => {
          const keypair = await createSvmKeypairFromSeed(
            keyring.value,
            personalWallet.derivationPath!,
          );
          return keypair.publicKey.toBase58();
        },
        async () => {
          const keypair = await createTvmKeypairFromSeed(
            keyring.value,
            personalWallet.derivationPath!,
          );
          return ethers.hexlify(keypair.publicKey).slice(2);
        },
      );
    } else if (personalWallet.type === IWalletType.PrivateKey) {
      return onBlockchain(blockchain)(
        async () => {
          const wallet = new SigningKey(keyring.value);
          return wallet.publicKey;
        },
        async () => {
          const uint8Array = decode(keyring.value);
          const keypair = Keypair.fromSecretKey(uint8Array);
          return keypair.publicKey.toBase58();
        },
        async () => {
          const uint8Array = ethers.getBytes(`0x${keyring.value}`);
          const keypair = nacl.sign.keyPair.fromSecretKey(uint8Array);
          return ethers.hexlify(keypair.publicKey).slice(2);
        },
      );
    }
    throw new Error(`Invalid wallet type=${personalWallet.type}`);
  }

  /////////////////////////////////////////////////////////////////////////////
  // evm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signEvmMessage(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    return signEvmMessageWithKeystore(keyrings, personalWallet, message);
  }

  public async signEvmTypedData(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    typedData: TypedData,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    return signEvmTypedDataWithKeystore(keyrings, personalWallet, typedData);
  }

  public async signEvmTransaction(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    transaction: ethers.TransactionRequest,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    return signEvmTransactionWithKeystore(
      keyrings,
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // svm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signSvmMessage(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    // TODO: should check for prefix to ensure this is not a tx
    // should not blind sign
    const keyrings = await this.getUserKeyrings(userId, password);
    return signSvmMessageWithKeystore(keyrings, personalWallet, message);
  }

  public async signSvmTransaction(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    transaction: string,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    return signSvmTransactionWithKeystore(
      keyrings,
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // tvm functions
  /////////////////////////////////////////////////////////////////////////////

  public async signTvmMessage(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    message: string,
  ) {
    // TODO: should check for prefix to ensure this is not a tx
    // should not blind sign
    const keyrings = await this.getUserKeyrings(userId, password);
    return signTvmMessageWithKeystore(keyrings, personalWallet, message);
  }

  public async signTvmTransaction(
    userId: string,
    password: string,
    personalWallet: IPersonalWallet,
    transaction: string,
  ) {
    const keyrings = await this.getUserKeyrings(userId, password);
    return signTvmTransactionWithKeystore(
      keyrings,
      personalWallet,
      transaction,
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // private functions
  /////////////////////////////////////////////////////////////////////////////

  private async setUserKeyrings(
    userId: string,
    password: string,
    keyrings: UserKeyrings,
  ) {
    const userKeyringMetadata: KeyringsMetadata = {};
    Object.values(keyrings).map((keyring) => {
      userKeyringMetadata[keyring.keyringIdentifier] = {
        type: keyring.type,
        blockchain: keyring.blockchain,
        keyringIdentifier: keyring.keyringIdentifier,
      };
    });

    const encryptedUserKeyrings = await this.encryptor.encrypt(
      password,
      keyrings,
    );
    const allKeyrings = await this.getEncryptedKeyrings();
    allKeyrings[userId] = encryptedUserKeyrings;
    await this.setEncryptedKeyrings(allKeyrings);
    await this.setUserKeyringsMetadata(userId, userKeyringMetadata);
  }

  private async deleteUserKeyrings(userId: string): Promise<void> {
    const allKeyrings = await this.getEncryptedKeyrings();
    delete allKeyrings[userId];
    await this.setEncryptedKeyrings(allKeyrings);
    await this.deleteUserKeyringsMetadata(userId);
  }

  private async getEncryptedKeyrings(): Promise<EncryptedKeyrings> {
    const key = StorageKey.Keyrings;
    const allKeyrings = await this.storage.get<EncryptedKeyrings>(key);
    return allKeyrings ?? {};
  }

  private async setEncryptedKeyrings(
    keyrings: EncryptedKeyrings,
  ): Promise<void> {
    const key = StorageKey.Keyrings;
    return this.storage.set(key, keyrings);
  }

  // keyring metadata

  public async getUserKeyringsMetadata(
    userId: string,
  ): Promise<KeyringsMetadata> {
    const allKeyringsMetadata = await this.getKeyringsMetadata();
    return allKeyringsMetadata[userId] ?? {};
  }

  private async getKeyringsMetadata(): Promise<AllKeyringsMetadata> {
    const key = StorageKey.KeyringsMetadata;
    const allKeyringsMetadata = await this.storage.get<AllKeyringsMetadata>(
      key,
    );
    return allKeyringsMetadata ?? {};
  }

  private async setUserKeyringsMetadata(
    userId: string,
    metadata: KeyringsMetadata,
  ): Promise<void> {
    const key = StorageKey.KeyringsMetadata;
    const allKeyringsMetadata = await this.getKeyringsMetadata();
    allKeyringsMetadata[userId] = metadata;
    return this.storage.set(key, allKeyringsMetadata);
  }

  private async deleteUserKeyringsMetadata(userId: string): Promise<void> {
    const key = StorageKey.KeyringsMetadata;
    const allKeyringsMetadata = await this.getKeyringsMetadata();
    delete allKeyringsMetadata[userId];
    return this.storage.set(key, allKeyringsMetadata);
  }
}
