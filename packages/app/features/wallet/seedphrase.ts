import { Keypair } from '@solana/web3.js';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { mnemonicToSeedSync } from 'bip39';
import { decode } from 'bs58';
import { ethers, HDNodeWallet, Wallet } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import nacl, { SignKeyPair } from 'tweetnacl';
import { SeedPhrase } from '../../common/types';
import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { onBlockchain } from '../chain';

export const defaultParentPath = "m/44'/60'/0'/0";
export const defaultSvmParentPath = "m/44'/501'";
export const defaultTvmParentPath = "m/44'/607'/0'";
export const defaultTvmSinglePath = 'TON_SINGLE';

export function generateSeedPhrase(): SeedPhrase {
  const mnemonic = Wallet.createRandom().mnemonic;
  if (!mnemonic) {
    throw new Error('failed to generate seed phrase');
  }
  const seedPhrase = mnemonic.phrase.split(' ');
  return seedPhrase;
}

export function getAddressFromPrivateKey(
  blockchain: IBlockchainType,
  privateKey: string,
): string {
  return onBlockchain(blockchain)(
    () => {
      const wallet = new Wallet(privateKey);
      return wallet.address;
    },
    () => {
      const uint8Array = decode(privateKey);
      const keypair = Keypair.fromSecretKey(uint8Array);
      return keypair.publicKey.toBase58();
    },
    () => {
      const keypair = nacl.sign.keyPair.fromSecretKey(
        ethers.getBytes(`0x${privateKey}`),
      );
      return WalletContractV4.create({
        workchain: 0,
        publicKey: Buffer.from(keypair.publicKey),
      }).address.toString({ urlSafe: true, bounceable: false });
    },
  );
}

export async function getKeyringIdentifierFromSeed(
  mnemonic: string,
  blockchain: IBlockchainType,
  derivationPath?: string,
): Promise<string> {
  // TON uses a different mnemonic validation so need a different identifier
  if (blockchain === IBlockchainType.Tvm) {
    const path = derivationPath ?? `${defaultTvmParentPath}/0'`;
    const pair = await createTvmKeypairFromSeed(mnemonic, path);
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(pair.publicKey),
    });
    return wallet.address.toString({ urlSafe: true, bounceable: false });
  } else {
    // use first ETH address as keyringIdentifier
    const wallet = await createEvmWalletFromSeed(mnemonic);
    return wallet.address;
  }
}

// Important: don't remove async - we need to keep function signature
// same as seedphrase.native.ts
export async function createEvmWalletFromSeed(
  mnemonic: string,
  path?: string,
): Promise<HDNodeWallet> {
  return HDNodeWallet.fromPhrase(mnemonic, undefined, path);
}

// Important: don't remove async - we need to keep function signature
// same as seedphrase.native.ts
export async function hdNodeFromSeed(
  mnemonic: string,
  parentPath: string,
): Promise<HDNodeWallet> {
  return HDNodeWallet.fromPhrase(mnemonic, undefined, parentPath);
}

export async function createSvmKeypairFromSeed(
  mnemonic: string,
  path: string,
): Promise<Keypair> {
  const seed = mnemonicToSeedSync(mnemonic, '');
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  return Keypair.fromSeed(hd.derive(path).privateKey);
}

export async function createTvmKeypairFromSeed(
  mnemonic: string,
  path: string,
): Promise<SignKeyPair> {
  if (path === defaultTvmSinglePath) {
    return mnemonicToPrivateKey(mnemonic.split(' '));
  } else {
    const seed = mnemonicToSeedSync(mnemonic, '');
    const hd = HDKey.fromMasterSeed(seed.toString('hex'));
    const privateKey = hd.derive(path).privateKey;
    return nacl.sign.keyPair.fromSeed(privateKey.slice(0, 32));
  }
}
