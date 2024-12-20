import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { TonTransport } from '@ton-community/ton-ledger';
import {
  Account,
  IPersonalWallet,
  LedgerPathType,
} from '../../../common/types';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { augmentWithNativeBalances } from '../../crypto/balance';
import { defaultTvmParentPath } from '../../wallet/seedphrase';
import { validateCorrectDevice } from '../utils';

const LEDGER_INS_SIGN_TX = 0x06;
const LEDGER_CLA = 0xe0;

export class LedgerTvmSigner {
  signTvmMessage(
    personalWallet: IPersonalWallet,
    message: string,
  ): Promise<string> {
    throw new Error('not implemented');
  }
  signTvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: string,
  ): Promise<string> {
    return signTransactionWithLedger(personalWallet, transaction);
  }
  getTvmPublicKey(personalWallet: IPersonalWallet): Promise<string> {
    return getLedgerPublicKey(personalWallet);
  }
}

export async function getTvmLedgerAddresses(
  transport: Transport,
  startAddress: number,
  numAddresses: number,
  pathType?: LedgerPathType,
) {
  const ledger = new TonTransport(transport);
  const addresses: Array<Account> = [];
  for (let index = 0; index < numAddresses; index++) {
    const derivationIndex = startAddress + index;
    const derivationPath = `${defaultTvmParentPath}/${derivationIndex}'`;
    const params = getLedgerAccountPathByIndex(index);
    const ledgerAddress = await ledger.getAddress(params, {
      bounceable: false,
      chain: 0,
    });
    addresses.push({
      blockchain: IBlockchainType.Svm,
      address: ledgerAddress.address,
      derivationIndex,
      derivationPath,
    });
  }
  return augmentWithNativeBalances(ChainId.Ton, addresses);
}

async function signTransactionWithLedger(
  personalWallet: IPersonalWallet,
  message: string,
) {
  let transport: Transport | undefined;
  const path = personalWallet.derivationPath!;
  const tonDerivationPathAccountRegex = /\/(\d+)'?$/;
  const matches = path.match(tonDerivationPathAccountRegex);
  if (!matches || !matches[1]) {
    throw new Error(`invalid derivation path=${path}`);
  }
  try {
    transport = await TransportWebHID.create();
    const ledger = new TonTransport(transport);
    const accountNumber = parseInt(matches[1], 10);
    const params = getLedgerAccountPathByIndex(accountNumber);
    const ledgerAddress = await ledger.getAddress(params, {
      bounceable: false,
      chain: 0,
    });
    validateCorrectDevice(personalWallet, ledgerAddress.address);
    throw new Error('Not implemented');
    return '';
  } finally {
    transport?.close();
  }
}

async function getLedgerPublicKey(personalWallet: IPersonalWallet) {
  let transport: Transport | undefined;
  const path = personalWallet.derivationPath!;
  const tonDerivationPathAccountRegex = /\/(\d+)'?$/;
  const matches = path.match(tonDerivationPathAccountRegex);
  if (!matches || !matches[1]) {
    throw new Error(`invalid derivation path=${path}`);
  }
  try {
    transport = await TransportWebHID.create();
    const ledger = new TonTransport(transport);
    const accountNumber = parseInt(matches[1], 10);
    const params = getLedgerAccountPathByIndex(accountNumber);
    const ledgerAddress = await ledger.getAddress(params, {
      bounceable: false,
      chain: 0,
    });
    validateCorrectDevice(personalWallet, ledgerAddress.address);
    return ledgerAddress.publicKey.toString('hex');
  } finally {
    transport?.close();
  }
}

function getLedgerAccountPathByIndex(
  index: number,
  options?: {
    isTestnet?: boolean;
    workchain?: number;
  },
) {
  const network = options?.isTestnet ? 1 : 0;
  const chain = options?.workchain === -1 ? 255 : 0;
  return [44, 607, network, chain, index, 0];
}

async function ledgerRequest(
  transport: Transport,
  ins: number,
  p1: number,
  p2: number,
  data: Buffer,
) {
  const r = await transport.send(LEDGER_CLA, ins, p1, p2, data);
  return r.subarray(0, r.length - 2);
}

function pathElementsToBuffer(paths: number[]): Buffer {
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
}

function chunks(buf: Buffer, n: number): Buffer[] {
  const nc = Math.ceil(buf.length / n);
  const cs: Buffer[] = [];
  for (let i = 0; i < nc; i++) {
    cs.push(buf.subarray(i * n, (i + 1) * n));
  }
  return cs;
}
