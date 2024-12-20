import { GaspumpJetton, calcBuyTonAmount } from '@gaspump/sdk';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { Address, beginCell, fromNano, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import { ethers } from 'ethers';
import { handleJSONResponse } from '../../../common/api/utils';
import { TonMessage } from '../../tvm/types';
import { GasPumpTokenMetadata } from './types';

export function prepareBuyTransaction(
  jettonAddress: string,
  tonAmount: string,
): TonMessage {
  const tonAmountNano = BigInt(tonAmount);
  const buyTonAmount = calcBuyTonAmount(tonAmountNano);
  const body = beginCell().storeUint(1825825968, 32).storeBit(true).endCell();
  const address = Address.parse(jettonAddress).toString({
    urlSafe: true,
    bounceable: true,
  });
  return {
    address: address,
    amount: buyTonAmount,
    body: body.toBoc().toString('base64'),
    bounce: true,
  };
}

export async function prepareSellTransaction(
  jettonAddress: string,
  jettonAmount: string,
  userWalletAddress: string,
): Promise<TonMessage> {
  const userAddress = Address.parse(userWalletAddress);
  const gaspumpJetton = await getGasPumpJetton(jettonAddress);
  const jettonWalletAddress = await gaspumpJetton.getJettonWalletAddress(
    userAddress,
  );

  const jettonAmountBig = BigInt(jettonAmount);
  const gasAmount = 0.3;
  const body = beginCell()
    .storeUint(0x595f07bc, 32)
    .storeUint(0, 64)
    .storeCoins(jettonAmountBig)
    .storeAddress(userAddress)
    .storeAddress(userAddress)
    .storeMaybeRef(null)
    .endCell();

  const address = jettonWalletAddress.toString({
    urlSafe: true,
    bounceable: true,
  });

  return {
    address: address,
    amount: toNano(gasAmount),
    body: body.toBoc().toString('base64'),
    bounce: true,
  };
}

export async function getGasPumpJetton(jettonAddress: string) {
  const endpoint = await getHttpEndpoint();
  const tonClient = new TonClient({
    endpoint,
  });
  return tonClient.open(
    GaspumpJetton.createFromAddress(Address.parse(jettonAddress)),
  );
}

export async function calculateGasPumpBuyAmount(
  tonAmount: string,
  jettonAddress: string,
): Promise<string> {
  const gasPumpJetton = await getGasPumpJetton(jettonAddress);
  const jettonAmount = await gasPumpJetton.getEstimateBuyJettonAmount(
    calcBuyTonAmount(BigInt(tonAmount)),
  );
  return fromNano(jettonAmount);
}

export async function calculateGasPumpSellAmount(
  jettonAmount: string,
  jettonAddress: string,
): Promise<string> {
  const gasPumpJetton = await getGasPumpJetton(jettonAddress);
  const tonAmount = await gasPumpJetton.getEstimateSellTonAmount(
    BigInt(jettonAmount),
  );
  return fromNano(tonAmount);
}

export async function getGasPumpMetadata(
  tokenAddress?: string,
): Promise<GasPumpTokenMetadata | null> {
  if (!tokenAddress) {
    return null;
  }
  const url = `https://api.gas111.com/api/v1/tokens/info?token_address=${tokenAddress}`;
  const response = await fetch(url);

  const data: GasPumpTokenMetadata = await handleJSONResponse(response);
  if (!isOnGasPumpBondingCurve(data)) {
    throw new Error('Bonding curve is complete.');
  }
  return data;
}

function isOnGasPumpBondingCurve(metadata: GasPumpTokenMetadata) {
  return !(metadata.pool_address || metadata.unwrapped_jetton_master_address);
}

export function calculateGasPumpTokenPrice(metadata: GasPumpTokenMetadata) {
  return metadata.market_cap
    ? parseFloat(ethers.formatUnits(metadata.market_cap, 18))
    : null;
}
