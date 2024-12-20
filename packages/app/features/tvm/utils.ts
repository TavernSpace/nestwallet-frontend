import { getHttpEndpoint } from '@orbs-network/ton-access';
import {
  Address,
  beginCell,
  Cell,
  external,
  SendMode,
  StateInit,
  storeMessage,
  storeStateInit,
  toNano,
} from '@ton/core';
import { sha256 } from '@ton/crypto';
import {
  JettonMaster,
  TonClient,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from '@ton/ton';
import { ConnectItem, DeviceInfo } from '@tonconnect/protocol';
import { ethers } from 'ethers';
import { DateTime } from 'luxon';
import { AssetTransfer } from '../../common/types';
import { isCryptoBalance } from '../../common/utils/types';
import {
  ICryptoBalance,
  INftBalance,
  IWallet,
} from '../../graphql/client/generated/graphql';
import {
  generateQueryId,
  getCommentBody,
  getJettonTransferBody,
  getNFTTransferBody,
} from './contract/encode';
import { AbstractTvmSigner } from './signer/types';
import { TonJettonData, TonMessage, WalletVersion } from './types';

export function isTONAddress(address: string) {
  return (
    (address.startsWith('UQ') || address.startsWith('EQ')) &&
    Address.isFriendly(address)
  );
}

export function normalizeTONAddress(address: string) {
  const bounceable = address.startsWith('EQ');
  return Address.parseFriendly(address).address.toString({
    bounceable,
    urlSafe: true,
  });
}

export async function getTonProvider(address: string) {
  const endpoint = await getHttpEndpoint();
  const tonClient = new TonClient({
    endpoint,
  });
  return tonClient.provider(Address.parse(address));
}

export async function getJettonAccount(wallet: IWallet, asset: string) {
  const master = JettonMaster.create(Address.parse(asset));
  const provider = await getTonProvider(asset);
  return master.getWalletAddress(provider, Address.parse(wallet.address));
}

export async function getJettonData(addr: string): Promise<TonJettonData> {
  const endpoint = await getHttpEndpoint();
  const result = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'getTokenData',
      params: {
        address: addr,
      },
      id: 1,
      jsonrpc: '2.0',
    }),
  });
  const data = await result.json();
  if (!data.ok) {
    throw new Error('token not found');
  } else {
    const jettonData = data.result.jetton_content.data;
    return {
      ...jettonData,
      decimals: jettonData.decimals ? parseInt(jettonData.decimals) : 9,
    };
  }
}

export async function getJettonTransferMessage(
  wallet: IWallet,
  asset: ICryptoBalance,
  recipient: string,
  amount: string,
  comment?: string,
) {
  const forward = comment ? getCommentBody(comment) : undefined;
  const body = getJettonTransferBody(
    recipient,
    wallet.address,
    ethers.parseUnits(amount, asset.tokenMetadata.decimals),
    generateQueryId(),
    undefined,
    forward,
  );
  const jettonAccount = await getJettonAccount(wallet, asset.address);
  const message: TonMessage = {
    address: jettonAccount.toString(),
    amount: toNano(0.1),
    body: body.toBoc().toString('base64'),
    bounce: true,
  };
  return message;
}

export async function getNftTransferMessage(
  wallet: IWallet,
  asset: INftBalance,
  recipient: string,
) {
  const body = getNFTTransferBody(recipient, wallet.address, generateQueryId());
  const message: TonMessage = {
    address: asset.address,
    amount: toNano(0.1),
    body: body.toBoc().toString('base64'),
    bounce: true,
  };
  return message;
}

export async function getTransferMessage(
  wallet: IWallet,
  value: AssetTransfer,
) {
  if (!isCryptoBalance(value.asset)) {
    return getNftTransferMessage(wallet, value.asset, value.recipient);
  }
  if (value.asset.tokenMetadata.isNativeToken) {
    const body = value.comment
      ? getCommentBody(value.comment).toBoc().toString('base64')
      : undefined;
    return {
      address: value.recipient,
      amount: value.value,
      body,
      bounce: value.recipient.startsWith('EQ'),
    };
  } else {
    return getJettonTransferMessage(
      wallet,
      value.asset,
      value.recipient,
      value.value,
      value.comment,
    );
  }
}

export function getExternalBoc(
  address: string,
  message: Cell,
  init?: StateInit,
) {
  const ext = external({
    to: address,
    init,
    body: message,
  });
  const cell = beginCell().store(storeMessage(ext)).endCell();
  const boc = cell.toBoc();
  return boc.toString('base64');
}

export async function sendBocWithResponse(endpoint: string, boc: string) {
  const result = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'sendBocReturnHash',
      params: {
        boc,
      },
      id: 1,
      jsonrpc: '2.0',
    }),
  });
  const data = await result.json();
  if (data.ok && data.result.hash) {
    return data.result.hash;
  } else {
    throw new Error('Failed to send transaction');
  }
}

export async function messageParams(
  client: TonClient,
  wallet:
    | WalletContractV3R1
    | WalletContractV3R2
    | WalletContractV4
    | WalletContractV5R1,
): Promise<{
  seqno: number;
  sendMode: number;
  stateInit?: StateInit;
}> {
  const provider = client.provider(wallet.address);
  const isDeployed = await client.isContractDeployed(wallet.address);
  if (isDeployed) {
    return {
      seqno: await wallet.getSeqno(provider),
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    };
  } else {
    return {
      seqno: 0,
      stateInit: wallet.init,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    };
  }
}

export function getTonWalletFromVersion(
  version: WalletVersion,
  publicKey: string,
) {
  const input = {
    workchain: 0,
    workChain: 0,
    publicKey: Buffer.from(ethers.getBytes(`0x${publicKey}`)),
  };
  return version === 'V3R1'
    ? WalletContractV3R1.create(input)
    : version === 'V3R2'
    ? WalletContractV3R2.create(input)
    : version === 'W5'
    ? WalletContractV5R1.create(input)
    : WalletContractV4.create(input);
}

export function getTonWalletId(
  tonWallet:
    | WalletContractV3R1
    | WalletContractV3R2
    | WalletContractV5R1
    | WalletContractV4,
) {
  const id = tonWallet.walletId;
  if (typeof id === 'number') {
    return id;
  } else {
    const context =
      typeof id.context === 'number'
        ? beginCell()
            .storeUint(0, 1)
            .storeUint(id.context, 31)
            .endCell()
            .beginParse()
            .loadInt(32)
        : beginCell()
            .storeUint(1, 1)
            .storeInt(id.context.workChain, 8)
            .storeUint(0, 8)
            .storeUint(id.context.subwalletNumber, 15)
            .endCell()
            .beginParse()
            .loadInt(32);
    return beginCell()
      .storeInt(BigInt(id.networkGlobalId) ^ BigInt(context), 32)
      .endCell()
      .beginParse()
      .loadInt(32);
  }
}

export async function generateTonConnectItemResponse(
  signer: AbstractTvmSigner,
  publicKey: string,
  tonWallet:
    | WalletContractV3R1
    | WalletContractV3R2
    | WalletContractV5R1
    | WalletContractV4,
  items?: ConnectItem[],
  manifest?: { name: string; url: string },
) {
  const result = await Promise.all(
    (items ?? []).map(async (item) => {
      if (item.name === 'ton_addr') {
        return {
          name: 'ton_addr',
          address: tonWallet.address.toRawString(),
          network: '-239',
          publicKey,
          walletStateInit: beginCell()
            .storeWritable(storeStateInit(tonWallet.init))
            .endCell()
            .toBoc()
            .toString('base64'),
        };
      } else {
        const domainHost = new URL(manifest!.url).hostname;
        const domain = ethers.toUtf8Bytes(domainHost);
        const message = {
          workchain: tonWallet.address.workChain,
          address: tonWallet.address.hash,
          domain: {
            lengthBytes: domain.length,
            value: domainHost,
          },
          payload: item.payload,
          timestamp: DateTime.now().toUnixInteger(),
        };

        const wc = Buffer.alloc(4);
        wc.writeUInt32BE(message.workchain, 0);

        const ts = Buffer.alloc(8);
        ts.writeBigUInt64LE(BigInt(message.timestamp), 0);

        const dl = Buffer.alloc(4);
        dl.writeUInt32LE(message.domain.lengthBytes, 0);

        const msg = Buffer.concat([
          Buffer.from('ton-proof-item-v2/'),
          wc,
          message.address,
          dl,
          Buffer.from(message.domain.value),
          ts,
          Buffer.from(message.payload),
        ]);

        const msgHash = Buffer.from(await sha256(msg));
        const fullMsg = Buffer.concat([
          Buffer.from([0xff, 0xff]),
          Buffer.from('ton-connect'),
          msgHash,
        ]);
        const result = Buffer.from(await sha256(fullMsg));
        const signature = await signer.signMessage(result.toString('hex'));
        return {
          name: 'ton_proof',
          proof: {
            timestamp: message.timestamp,
            domain: message.domain,
            signature: Buffer.from(ethers.getBytes(`0x${signature}`)).toString(
              'base64',
            ),
            payload: message.payload,
          },
        };
      }
    }),
  );
  return result;
}

export const getDeviceInfo = (platform: DeviceInfo['platform']): DeviceInfo => {
  return {
    platform,
    appName: 'Tonkeeper',
    // TODO(Ton): get from manifest e.g. appVersion: packageJson.version,
    appVersion: '1.0.108',
    maxProtocolVersion: 2,
    features: [
      'SendTransaction',
      {
        name: 'SendTransaction',
        maxMessages: 4,
      },
    ],
  };
};
