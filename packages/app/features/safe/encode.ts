import Safe, {
  SafeAccountConfig,
  encodeMultiSendData,
} from '@safe-global/protocol-kit';
import SafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { SafeTransactionProposalWithNonce } from '../../common/types';
import {
  changeThresholdABIInterface,
  createProxyWithNonceInterface,
  execTransactionABIInterface,
  multiSendABIInterface,
  safeAddOwnerWithThresholdABIInterface,
  safeRemoveOwnerABIInterface,
  safeSwapOwnerABIInterface,
  setupABIInterface,
} from './abi';

export function getSafeTxTransactionData(safe: Safe, safeTx: SafeTransaction) {
  const EXEC_TX_METHOD = 'execTransaction';
  return safe
    .getContractManager()
    .safeContract!.encode(EXEC_TX_METHOD, [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      safeTx.encodedSignatures(),
    ]);
}

export const getSafeAddOwnerWithThresholdTransactionData = (
  address: string,
  owner: string,
  threshold: number,
) => {
  const data = safeAddOwnerWithThresholdABIInterface.encodeFunctionData(
    'addOwnerWithThreshold',
    [owner, threshold],
  );
  return {
    to: address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getSafeRemoveOwnerTransactionData = (
  address: string,
  prevOwner: string,
  owner: string,
  threshold: number,
) => {
  const data = safeRemoveOwnerABIInterface.encodeFunctionData('removeOwner', [
    prevOwner,
    owner,
    threshold,
  ]);
  return {
    to: address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getSafeSwapOwnerTransactionData = (
  address: string,
  prevOwner: string,
  oldOwner: string,
  newOwner: string,
) => {
  const data = safeSwapOwnerABIInterface.encodeFunctionData('swapOwner', [
    prevOwner,
    oldOwner,
    newOwner,
  ]);
  return {
    to: address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getSafeChangeThresholdTransactionData = (
  address: string,
  threshold: number,
) => {
  const data = changeThresholdABIInterface.encodeFunctionData(
    'changeThreshold',
    [threshold],
  );
  return {
    to: address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getExecTransactionTransactionData = (
  proposal: SafeTransactionProposalWithNonce,
) => {
  const signature = [...proposal.confirmations]
    .sort((conf1, conf2) =>
      conf1.signer.toLowerCase().localeCompare(conf2.signer.toLowerCase()),
    )
    .map((conf) => conf.signature.slice(2))
    .join('');
  const data = execTransactionABIInterface.encodeFunctionData(
    'execTransaction',
    [
      proposal.toAddress,
      proposal.value,
      proposal.data || '0x',
      proposal.operation,
      proposal.safeTxGas,
      proposal.baseGas,
      proposal.gasPrice,
      proposal.gasToken,
      proposal.refundReceiver,
      `0x${signature}`,
    ],
  );
  return {
    to: proposal.wallet.address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getMultiSendTransactionData = (
  txs: MetaTransactionData[],
  multiSendContractAddress: string,
) => {
  const encodedTxs = encodeMultiSendData(
    txs.map((tx) => ({ ...tx, operation: 0 })),
  );
  const data = multiSendABIInterface.encodeFunctionData('multiSend', [
    encodedTxs,
  ]);
  return {
    to: multiSendContractAddress,
    value: ethers.toBeHex(0),
    data,
  };
};

export function decodeSafeSetupData(data: string): SafeAccountConfig {
  const result = setupABIInterface.decodeFunctionData('setup', data);
  return {
    owners: result[0],
    threshold: Number(result[1]),
    to: result[2],
    data: result[3],
    fallbackHandler: result[4],
    paymentToken: result[5],
    payment: Number(result[6]),
    paymentReceiver: result[7],
  };
}

export function decodeSafeCreationData(data: string) {
  const result = createProxyWithNonceInterface.decodeFunctionData(
    'createProxyWithNonce',
    data,
  );
  return {
    masterCopy: result[0] as string,
    initializer: result[1] as string,
    saltNonce: result[2] as bigint,
  };
}

export function decodeSafeInfoFromCreationData(data: string) {
  const { initializer } = decodeSafeCreationData(data);
  return decodeSafeSetupData(initializer);
}
