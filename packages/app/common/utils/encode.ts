import { Transaction, ethers } from 'ethers';

export const NEST_MESSAGE_ID =
  'nest_d2d29827-18f8-4abf-9cff-16be0f3b5683_message';

export function encodeMessage(data: string | Record<any, any>) {
  if (typeof data === 'string') {
    return `${NEST_MESSAGE_ID}${data}`;
  } else {
    return `${NEST_MESSAGE_ID}${JSON.stringify(data)}`;
  }
}

export function decodeMessage<T>(data: unknown): T | undefined {
  try {
    return typeof data === 'string' && data.startsWith(NEST_MESSAGE_ID)
      ? JSON.parse(data.slice(NEST_MESSAGE_ID.length))
      : undefined;
  } catch {
    return undefined;
  }
}

export function encodeTransaction(transaction: any) {
  // We don't care about gasLimit, gasPrice  or tx type here since it is computed in our wallet
  // just get the important fields for us here and set some default legacy gas data
  const tx: ethers.TransactionLike = {
    to: transaction.to,
    value: transaction.value,
    data: transaction.data,
    chainId: BigInt(transaction.chainId),
    gasPrice: 0,
    gasLimit: 0,
  };
  return Transaction.from(tx).unsignedSerialized;
}
