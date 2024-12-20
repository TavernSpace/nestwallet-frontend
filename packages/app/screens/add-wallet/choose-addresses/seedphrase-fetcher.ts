import { Keypair } from '@solana/web3.js';
import { WalletContractV4 } from '@ton/ton';
import { mnemonicToSeedSync } from 'bip39';
import { HDNodeWallet } from 'ethers';
import { HDKey } from 'micro-ed25519-hdkey';
import { useState } from 'react';
import nacl from 'tweetnacl';
import { ChainId } from '../../../features/chain';
import { augmentWithNativeBalances } from '../../../features/crypto/balance';
import {
  defaultParentPath,
  defaultSvmParentPath,
  defaultTvmParentPath,
  hdNodeFromSeed,
} from '../../../features/wallet/seedphrase';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';

export function useEvmSeedPhraseFetcher(seedPhrase: string | undefined) {
  const [hdNode, setHdNode] = useState<HDNodeWallet | undefined>(undefined);

  async function fetch(curAddress: number, numAddresses: number) {
    const res = await getEvmAddressesFromSeedPhrase(
      seedPhrase!,
      curAddress,
      numAddresses,
      hdNode,
    );
    setHdNode(res.hdk);
    return res.wallets;
  }
  return { fetch };
}

export function useSvmSeedPhraseFetcher(seedPhrase: string | undefined) {
  const [hdNode, setHdNode] = useState<HDKey | undefined>(undefined);

  async function fetch(curAddress: number, numAddresses: number) {
    const res = await getSvmAddressesFromSeedPhrase(
      seedPhrase!,
      curAddress,
      numAddresses,
      hdNode,
    );
    setHdNode(res.hdk);
    return res.wallets;
  }
  return { fetch };
}

export function useTvmSeedPhraseFetcher(seedPhrase: string | undefined) {
  const [hdNode, setHdNode] = useState<HDKey | undefined>(undefined);

  async function fetch(curAddress: number, numAddresses: number) {
    const res = await getTvmAddressesFromSeedPhrase(
      seedPhrase!,
      curAddress,
      numAddresses,
      hdNode,
    );
    setHdNode(res.hdk);
    return res.wallets;
  }
  return { fetch };
}

export async function getEvmAddressesFromSeedPhrase(
  seedPhrase: string,
  startAddress: number,
  numAddresses: number,
  hdk?: HDNodeWallet,
) {
  const hdNode = hdk ?? (await hdNodeFromSeed(seedPhrase, defaultParentPath));
  const addresses = [];
  for (let i = 0; i < numAddresses; i++) {
    // seedphrase derivation path is different from ledger
    const derivationIndex = startAddress + i;
    // derive child from this node
    const childNode = hdNode.deriveChild(derivationIndex);
    const address = childNode.address;
    const derivationPath = childNode.path!;
    addresses.push({
      blockchain: IBlockchainType.Evm,
      address,
      derivationIndex,
      derivationPath,
    });
  }
  const wallets = await augmentWithNativeBalances(ChainId.Ethereum, addresses);
  return { wallets, hdk };
}

export async function getSvmAddressesFromSeedPhrase(
  seedPhrase: string,
  startAddress: number,
  numAddresses: number,
  hdk?: HDKey,
) {
  const seed = mnemonicToSeedSync(seedPhrase, '');
  const hdNode = hdk ?? HDKey.fromMasterSeed(seed.toString('hex'));
  const addresses = [];
  for (let i = 0; i < numAddresses; i++) {
    // seedphrase derivation path is different from ledger
    const derivationIndex = startAddress + i;
    const derivationPath = `${defaultSvmParentPath}/${derivationIndex}'/0'`;
    const derivedNode = hdNode.derive(derivationPath);
    const keypair = Keypair.fromSeed(derivedNode.privateKey);
    const address = keypair.publicKey.toBase58();
    addresses.push({
      blockchain: IBlockchainType.Svm,
      address,
      derivationIndex,
      derivationPath,
    });
  }
  const wallets = await augmentWithNativeBalances(ChainId.Solana, addresses);
  return { wallets, hdk };
}

export async function getTvmAddressesFromSeedPhrase(
  seedPhrase: string,
  startAddress: number,
  numAddresses: number,
  hdk?: HDKey,
) {
  const seed = mnemonicToSeedSync(seedPhrase, '');
  const hdNode = hdk ?? HDKey.fromMasterSeed(seed.toString('hex'));
  const addresses = [];
  for (let i = 0; i < numAddresses; i++) {
    // seedphrase derivation path is different from ledger
    const derivationIndex = startAddress + i;
    const derivationPath = `${defaultTvmParentPath}/${derivationIndex}'`;
    const derivedNode = hdNode.derive(derivationPath);
    const keypair = nacl.sign.keyPair.fromSeed(derivedNode.privateKey);
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(keypair.publicKey),
    });
    const address = wallet.address.toString({
      urlSafe: true,
      bounceable: false,
    });
    addresses.push({
      blockchain: IBlockchainType.Tvm,
      address,
      derivationIndex,
      derivationPath,
    });
  }
  const wallets = await augmentWithNativeBalances(ChainId.Ton, addresses);
  return { wallets, hdk };
}
