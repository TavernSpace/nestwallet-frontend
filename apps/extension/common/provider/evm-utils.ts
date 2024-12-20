import {
  ETHEREUM_RPC_METHOD_RPC_REQUEST,
  ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
  ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
  ETHEREUM_RPC_METHOD_SIGN_TX,
  ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
} from '@nestwallet/app/common/constants';
import { encodeTransaction } from '@nestwallet/app/common/utils/encode';
import { Transaction } from 'ethers';
import type { RequestManager } from './request-manager';

export async function sendEthRPCRequest(
  requestManager: RequestManager,
  chainId: number,
  method: string,
  params: any,
): Promise<any> {
  return await requestManager.request({
    method: ETHEREUM_RPC_METHOD_RPC_REQUEST,
    params: [chainId, method, params],
  });
}

export async function signEvmTransaction(
  publicKey: string,
  requestManager: RequestManager,
  transaction: any,
): Promise<Transaction> {
  const serializedTx = encodeTransaction(transaction);
  return await requestManager.request({
    method: ETHEREUM_RPC_METHOD_SIGN_TX,
    params: [serializedTx, publicKey],
  });
}

export async function sendEvmTransaction(
  publicKey: string,
  requestManager: RequestManager,
  transaction: any,
): Promise<any> {
  const serializedTx = encodeTransaction(transaction);
  return await requestManager.request({
    method: ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
    params: [serializedTx, publicKey],
  });
}

export async function signEvmMessage(
  publicKey: string,
  requestManager: RequestManager,
  message: string,
  chainId: number,
): Promise<Uint8Array> {
  return await requestManager.request({
    method: ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
    params: [message, publicKey, chainId],
  });
}

export async function signEvmTypedData(
  publicKey: string,
  requestManager: RequestManager,
  typedData: string,
  chainId: number,
): Promise<Uint8Array> {
  return await requestManager.request({
    method: ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
    params: [typedData, publicKey, chainId],
  });
}

export function resemblesETHAddress(value: string) {
  return value.length === 42;
}
