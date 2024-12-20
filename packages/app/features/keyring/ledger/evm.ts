import Ethereum from '@ledgerhq/hw-app-eth';
import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { PerformActionTransaction, ethers } from 'ethers';
import {
  Account,
  IPersonalWallet,
  LedgerPathType,
} from '../../../common/types';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { augmentWithNativeBalances } from '../../crypto/balance';
import { IEvmSigner, TypedData } from '../types';
import { getDomainAndMessageHash, validateCorrectDevice } from '../utils';

export class LedgerEvmSigner implements IEvmSigner {
  signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string> {
    return signMessageWithLedger(personalWallet, message);
  }
  signEvmTypedData(
    personalWallet: IPersonalWallet,
    typedData: TypedData,
  ): Promise<string> {
    return signTypedDataWithLedger(personalWallet, typedData);
  }
  signEvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: PerformActionTransaction,
  ): Promise<string> {
    return signTransactionWithLedger(personalWallet, transaction);
  }
}

export async function getEvmLedgerAddresses(
  transport: Transport,
  startAddress: number,
  numAddresses: number,
  pathType?: LedgerPathType,
) {
  const ledger = new Ethereum(transport);
  const addresses: Array<Account> = [];
  for (let index = 0; index < numAddresses; index++) {
    const derivationIndex = startAddress + index;
    const derivationPath =
      pathType === LedgerPathType.DefaultEvm
        ? `m/44'/60'/0'/${derivationIndex}`
        : `m/44'/60'/${derivationIndex}'/0/0`;
    const ledgerAddress = await ledger.getAddress(derivationPath);
    addresses.push({
      blockchain: IBlockchainType.Evm,
      address: ledgerAddress.address,
      derivationIndex,
      derivationPath,
    });
  }
  return augmentWithNativeBalances(ChainId.Ethereum, addresses);
}

async function signMessageWithLedger(
  personalWallet: IPersonalWallet,
  message: string | Uint8Array,
) {
  let transport: Transport | undefined;
  try {
    const messageHex = Buffer.from(message as any).toString('hex');
    const path = personalWallet.derivationPath!;
    transport = await TransportWebHID.create();
    const ledger = new Ethereum(transport);
    const address = await ledger.getAddress(path);
    validateCorrectDevice(personalWallet, address.address);
    const signature = await ledger.signPersonalMessage(path, messageHex);
    const signedHash =
      '0x' + signature.r + signature.s + signature.v.toString(16);
    return signedHash;
  } finally {
    transport?.close();
  }
}

async function signTypedDataWithLedger(
  personalWallet: IPersonalWallet,
  typedData: TypedData,
) {
  let transport: Transport | undefined;
  try {
    const path = personalWallet.derivationPath!;
    transport = await TransportWebHID.create();
    const ledger = new Ethereum(transport);
    const address = await ledger.getAddress(path);
    validateCorrectDevice(personalWallet, address.address);
    const { domainHash, messageHash } = getDomainAndMessageHash(typedData);
    if (!messageHash) {
      throw new Error('primaryType cannot be EIP712Domain');
    }
    const signature = await ledger.signEIP712HashedMessage(
      path,
      domainHash,
      messageHash,
    );
    return '0x' + signature.r + signature.s + signature.v.toString(16);
  } finally {
    transport?.close();
  }
}

async function signTransactionWithLedger(
  personalWallet: IPersonalWallet,
  unsignedTx: ethers.PerformActionTransaction,
) {
  let transport: Transport | undefined;
  try {
    const path = personalWallet.derivationPath!;
    transport = await TransportWebHID.create();
    const ledger = new Ethereum(transport);
    const address = await ledger.getAddress(path);
    validateCorrectDevice(personalWallet, address.address);
    const rawTxHex = ethers.Transaction.from(unsignedTx).unsignedSerialized;
    // need to strip the 0x from rawTxHex
    const result = await ledger.signTransaction(path, rawTxHex.slice(2));
    return ethers.Transaction.from({
      ...unsignedTx,
      signature: {
        r: '0x' + result.r,
        s: '0x' + result.s,
        v: parseInt(result.v, 16),
      },
    }).serialized;
  } finally {
    transport?.close();
  }
}
