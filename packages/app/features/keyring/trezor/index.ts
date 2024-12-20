import TrezorConnect, {
  EthereumSignTypedDataMessage,
  EthereumTransaction,
  EthereumTransactionEIP1559,
} from '@trezor/connect-web';
import {
  HDNodeVoidWallet,
  HDNodeWallet,
  PerformActionTransaction,
  ethers,
} from 'ethers';
import { Account, IPersonalWallet } from '../../../common/types';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { augmentWithNativeBalances } from '../../crypto/balance';
import { IEvmSigner, TypedData } from '../types';
import { getDomainAndMessageHash, validateCorrectDevice } from '../utils';

const basePath = "m/44'/60'/0'/0";

export class TrezorEvmSigner implements IEvmSigner {
  signEvmMessage(
    personalWallet: IPersonalWallet,
    message: string | Uint8Array,
  ): Promise<string> {
    return signMessageWithTrezor(personalWallet, message);
  }
  signEvmTypedData(
    personalWallet: IPersonalWallet,
    typedData: TypedData,
  ): Promise<string> {
    return signTypedDataWithTrezor(personalWallet, typedData);
  }
  signEvmTransaction(
    personalWallet: IPersonalWallet,
    transaction: PerformActionTransaction,
  ): Promise<string> {
    return signTransactionWithTrezor(personalWallet, transaction);
  }
}

export async function getTrezorAddresses(
  startAddress: number,
  numAddresses: number,
  hdk?: HDNodeWallet | HDNodeVoidWallet,
) {
  if (!hdk) {
    TrezorConnect.init({
      lazyLoad: true,
      manifest: {
        email: 'contact@nestwallet.xyz',
        appUrl: 'https://nestwallet.xyz/',
      },
    });
    const response = await TrezorConnect.getPublicKey({
      path: basePath,
      coin: 'eth',
      showOnTrezor: false,
    });
    if (response.success) {
      hdk = HDNodeWallet.fromExtendedKey(response.payload.xpub);
    } else {
      throw new Error(response.payload.error);
    }
  }
  const addresses: Array<Account> = [];
  for (let i = 0; i < numAddresses; i++) {
    const derivationIndex = startAddress + i;
    const derivationPath = `${basePath}/${derivationIndex}`;
    const hdNode = hdk.derivePath(`${derivationIndex}`);
    addresses.push({
      blockchain: IBlockchainType.Evm,
      address: hdNode.address,
      derivationIndex: derivationIndex,
      derivationPath: derivationPath,
    });
  }
  const wallets = await augmentWithNativeBalances(ChainId.Ethereum, addresses);
  return { wallets, hdk };
}

async function signTypedDataWithTrezor(
  personalWallet: IPersonalWallet,
  typedData: TypedData,
) {
  const path = personalWallet.derivationPath!;
  TrezorConnect.init({
    lazyLoad: true,
    manifest: {
      email: 'contact@nestwallet.xyz',
      appUrl: 'https://nestwallet.xyz/',
    },
  });
  const { domainHash, messageHash } = getDomainAndMessageHash(typedData);
  const result = await TrezorConnect.ethereumSignTypedData({
    path: path,
    data: typedData as EthereumSignTypedDataMessage<any>,
    metamask_v4_compat: true,
    // These are optional, but required for T1 compatibility
    domain_separator_hash: domainHash,
    message_hash: messageHash ?? undefined,
  });
  if (result.success) {
    validateCorrectDevice(personalWallet, result.payload.address);
    return result.payload.signature;
  } else {
    throw new Error(result.payload.error);
  }
}

async function signMessageWithTrezor(
  personalWallet: IPersonalWallet,
  message: string | Uint8Array,
) {
  const messageHex = Buffer.from(message).toString('hex');
  const path = personalWallet.derivationPath!;
  TrezorConnect.init({
    lazyLoad: true,
    manifest: {
      email: 'contact@nestwallet.xyz',
      appUrl: 'https://nestwallet.xyz/',
    },
  });
  const params = {
    path: path,
    message: messageHex,
    hex: true,
  };
  const result = await TrezorConnect.ethereumSignMessage(params);
  if (result.success) {
    validateCorrectDevice(personalWallet, result.payload.address);
    return result.payload.signature;
  } else {
    throw new Error(result.payload.error);
  }
}

async function signTransactionWithTrezor(
  personalWallet: IPersonalWallet,
  transaction: ethers.PerformActionTransaction,
) {
  const path = personalWallet.derivationPath!;
  TrezorConnect.init({
    lazyLoad: true,
    manifest: {
      email: 'contact@nestwallet.xyz',
      appUrl: 'https://nestwallet.xyz/',
    },
  });

  // https://docs.trezor.io/trezor-suite/packages/connect/methods/ethereumSignTransaction.html
  // NOTE: txType is reserved for WanChain see: https://github.com/trezor/trezor-mcu/blob/8af1f3643651e1cbee6b6196401f9c63e7cfc0f9/firmware/ethereum.c#L449C35-L449C42
  const ethersTx = {
    to: transaction.to!,
    value: ethers.toBeHex(transaction.value ?? 0),
    gasLimit: ethers.toBeHex(transaction.gasLimit!),
    gasPrice: transaction.gasPrice
      ? ethers.toBeHex(transaction.gasPrice)
      : undefined,
    nonce: ethers.toBeHex(transaction.nonce!),
    data: transaction.data,
    chainId: Number(transaction.chainId!),
    maxFeePerGas: transaction.maxFeePerGas
      ? ethers.toBeHex(transaction.maxFeePerGas)
      : undefined,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
      ? ethers.toBeHex(transaction.maxPriorityFeePerGas)
      : undefined,
    accessList: transaction.accessList,
  } as EthereumTransaction | EthereumTransactionEIP1559;

  const result = await TrezorConnect.ethereumSignTransaction({
    path: path,
    transaction: ethersTx,
  });
  if (result.success) {
    // TODO: result.payload doesn't contain signer address, need to check
    // if user signed with correct device
    const signature = result.payload;
    return ethers.Transaction.from({
      ...transaction,
      signature: {
        r: signature.r,
        s: signature.s,
        v: parseInt(signature.v, 16),
      },
    }).serialized;
  } else {
    throw new Error(result.payload.error);
  }
}
