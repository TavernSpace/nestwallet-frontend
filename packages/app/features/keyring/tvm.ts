import { sign } from '@ton/crypto';
import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import { IKeyring, IPersonalWallet } from '../../common/types';
import { IWalletType } from '../../graphql/client/generated/graphql';
import { createTvmKeypairFromSeed } from '../wallet/seedphrase';

export async function signTvmMessageWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  message: string,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];
  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const keypair = await createTvmKeypairFromSeed(
      keyring.value,
      personalWallet.derivationPath!,
    );
    return sign(
      Buffer.from(ethers.getBytes(`0x${message}`)),
      Buffer.from(keypair.secretKey),
    ).toString('hex');
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const uint8Array = Buffer.from(keyring.value, 'base64');
    const keypair = nacl.sign.keyPair.fromSeed(uint8Array);
    return sign(
      Buffer.from(ethers.getBytes(`0x${message}`)),
      Buffer.from(keypair.secretKey),
    ).toString('hex');
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}

export async function signTvmTransactionWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  message: string,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];
  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const keypair = await createTvmKeypairFromSeed(
      keyring.value,
      personalWallet.derivationPath!,
    );
    return sign(
      Buffer.from(ethers.getBytes(`0x${message}`)),
      Buffer.from(keypair.secretKey),
    ).toString('hex');
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const uint8Array = Buffer.from(keyring.value, 'base64');
    const keypair = nacl.sign.keyPair.fromSeed(uint8Array);
    return sign(
      Buffer.from(ethers.getBytes(`0x${message}`)),
      Buffer.from(keypair.secretKey),
    ).toString('hex');
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}
