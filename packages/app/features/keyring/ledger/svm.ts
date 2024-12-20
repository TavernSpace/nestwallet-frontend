import Solana from '@ledgerhq/hw-app-solana';
import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { decode, encode } from 'bs58';
import {
  Account,
  IPersonalWallet,
  LedgerPathType,
} from '../../../common/types';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { augmentWithNativeBalances } from '../../crypto/balance';
import { defaultSvmParentPath } from '../../wallet/seedphrase';
import { validateCorrectDevice } from '../utils';

export class LedgerSvmSigner {
  signSvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string> {
    return signMessageWithLedger(personalWallet, message);
  }
  signSvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string> {
    return signTransactionWithLedger(personalWallet, transaction);
  }
}

export async function getSvmLedgerAddresses(
  transport: Transport,
  startAddress: number,
  numAddresses: number,
  pathType?: LedgerPathType,
) {
  const ledger = new Solana(transport);
  const addresses: Array<Account> = [];
  for (let index = 0; index < numAddresses; index++) {
    const derivationIndex = startAddress + index;
    // ledger derivation path do not want the m/ prefix
    const derivationPath =
      `${defaultSvmParentPath}/${derivationIndex}'/0'`.replace('m/', '');
    const ledgerAddress = await ledger.getAddress(derivationPath);
    const publicKey = new PublicKey(ledgerAddress.address).toBase58();
    addresses.push({
      blockchain: IBlockchainType.Svm,
      address: publicKey,
      derivationIndex,
      derivationPath,
    });
  }
  return augmentWithNativeBalances(ChainId.Solana, addresses);
}

async function signMessageWithLedger(
  personalWallet: IPersonalWallet,
  message: string,
) {
  let transport: Transport | undefined;
  try {
    const path = personalWallet.derivationPath!;
    transport = await TransportWebHID.create();
    const ledger = new Solana(transport);
    const address = await ledger.getAddress(path);
    const publicKey = new PublicKey(address.address).toBase58();
    validateCorrectDevice(personalWallet, publicKey);
    const resp = await ledger.signOffchainMessage(path, decode(message));
    return encode(resp.signature);
  } finally {
    transport?.close();
  }
}

async function signTransactionWithLedger(
  personalWallet: IPersonalWallet,
  transaction: string,
) {
  let transport: Transport | undefined;
  try {
    const path = personalWallet.derivationPath!;
    transport = await TransportWebHID.create();
    const ledger = new Solana(transport);
    const address = await ledger.getAddress(path);
    const publicKey = new PublicKey(address.address).toBase58();
    validateCorrectDevice(personalWallet, publicKey);
    const versionedTx = VersionedTransaction.deserialize(decode(transaction));
    const message = versionedTx.message.serialize();
    const resp = await ledger.signTransaction(path, Buffer.from(message));
    return encode(resp.signature);
  } finally {
    transport?.close();
  }
}
