import { TypedDataDomain, TypedDataField, ethers } from 'ethers';
import { IPersonalWallet } from '../../common/types';

export interface TypedData {
  primaryType?: string;
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>;
}

export interface IEncryptor {
  encrypt<T>(password: string, dataObj: T): Promise<string>;
  decrypt(password: string, text: string): Promise<unknown>;
}

export interface IStorage {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface IEvmSigner {
  signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string>;

  signEvmTypedData(
    personalWallet: IPersonalWallet,
    message: TypedData,
  ): Promise<string>;

  signEvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: ethers.PerformActionTransaction,
  ): Promise<string>;
}

export interface ISvmSigner {
  signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string>;

  signSvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string>;
}

export interface ITvmSigner {
  signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string>;

  signTvmTransaction(
    personalWallet: IPersonalWallet,
    transactions: string,
  ): Promise<string>;

  getTvmPublicKey(personalWallet: IPersonalWallet): Promise<string>;
}
