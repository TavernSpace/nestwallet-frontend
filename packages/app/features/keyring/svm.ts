import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { decode, encode } from 'bs58';
import nacl from 'tweetnacl';
import { IKeyring, IPersonalWallet } from '../../common/types';
import { IWalletType } from '../../graphql/client/generated/graphql';
import { createSvmKeypairFromSeed } from '../wallet/seedphrase';

export async function signSvmMessageWithKeystore(
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
  const messageBytes = decode(message);
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const keypair = await createSvmKeypairFromSeed(
      keyring.value,
      personalWallet.derivationPath!,
    );
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    return encode(signature);
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const uint8Array = decode(keyring.value);
    const keypair = Keypair.fromSecretKey(uint8Array);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    return encode(signature);
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}

export async function signSvmTransactionWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  transaction: string,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];
  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  const versionedTx = VersionedTransaction.deserialize(decode(transaction));
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const keypair = await createSvmKeypairFromSeed(
      keyring.value,
      personalWallet.derivationPath!,
    );
    versionedTx.sign([keypair]);
    return encode(versionedTx.signatures[0]!);
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const uint8Array = decode(keyring.value);
    const keypair = Keypair.fromSecretKey(uint8Array);
    versionedTx.sign([keypair]);
    return encode(versionedTx.signatures[0]!);
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}
