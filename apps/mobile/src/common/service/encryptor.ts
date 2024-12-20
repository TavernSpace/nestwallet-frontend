import { IEncryptor } from '@nestwallet/app/features/keyring/types';
import { NativeModules } from 'react-native';
import crypto from 'react-native-quick-crypto';
const Aes = NativeModules.Aes;

interface EncryptedData {
  cipher: string;
  iv: string;
  salt: string;
}

// https://github.com/MetaMask/metamask-mobile/blob/a4b8ba99fd2ef0ebe0d43a02e21e5d8818ed1a5a/app/core/Encryptor.js

export default class Encryptor implements IEncryptor {
  key: string | null = null;

  public async encrypt<T>(password: string, object: T): Promise<string> {
    const salt = this.generateSalt(16);
    const key = await this.keyFromPassword(password, salt);
    const result = await this.encryptWithKey(JSON.stringify(object), key);
    const extendedResult: EncryptedData = { ...result, salt };
    return JSON.stringify(extendedResult);
  }

  public async decrypt<T extends unknown>(
    password: string,
    encryptedString: string,
  ): Promise<T> {
    const encryptedData: EncryptedData = JSON.parse(encryptedString);
    const key = await this.keyFromPassword(password, encryptedData.salt);
    const data = await this.decryptWithKey(encryptedData, key);
    return JSON.parse(data);
  }

  public generateSalt(byteCount: number = 32): string {
    const view = new Uint8Array(byteCount);
    crypto.getRandomValues(view);
    return Buffer.from(view).toString('base64');
  }

  private async generateKey(password: string, salt: string): Promise<string> {
    return Aes.pbkdf2(password, salt, 5000, 256);
  }

  private keyFromPassword(password: string, salt: string): Promise<string> {
    return this.generateKey(password, salt);
  }

  private async encryptWithKey(
    text: string,
    keyBase64: string,
  ): Promise<{ cipher: string; iv: string }> {
    const iv = await Aes.randomKey(16);
    return Aes.encrypt(text, keyBase64, iv, 'CBC').then((cipher: any) => ({
      cipher,
      iv,
    }));
  }

  private decryptWithKey(
    encryptedData: EncryptedData,
    key: string,
  ): Promise<string> {
    return Aes.decrypt(encryptedData.cipher, key, encryptedData.iv, 'CBC');
  }
}
