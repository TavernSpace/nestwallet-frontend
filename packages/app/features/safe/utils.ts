import SafeApiKit, { SafeInfoResponse } from '@safe-global/api-kit';
import Safe, {
  EthSafeSignature,
  EthersAdapter,
} from '@safe-global/protocol-kit';
import SafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { SafeTransactionProposalWithNonce } from '../../common/types';
import {
  IProposalState,
  ISafeMessageProposal,
  ISafeTransactionProposal,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ChainId } from '../chain';
import { safeSentinelAddress } from '../evm/constants';
import { getJSONRPCProvider } from '../evm/provider';

export enum SafeTxState {
  Failed = 6,
  Executed = 5,
  Executing = 4,
  ReadyToExecute = 3,
  MissingSignature = 2,
  NotCreated = 1,
}

const safeWithDefaultProviderMap = new Map<string, Safe>();

export async function createSafe(safeWallet: IWallet) {
  const safeAddress = safeWallet.address;
  const chainId = safeWallet.chainId;
  const key = `${chainId}:${safeAddress}`;
  if (safeWithDefaultProviderMap.has(key)) {
    return safeWithDefaultProviderMap.get(key)!;
  }
  const provider = getJSONRPCProvider(chainId);
  const safe = await createSafeWithProvider(safeWallet, provider);
  safeWithDefaultProviderMap.set(key, safe);
  return safe;
}

export function createSafeWithProvider(
  safeWallet: IWallet,
  signerOrProvider: ethers.Provider | ethers.AbstractSigner<ethers.Provider>,
) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signerOrProvider,
  });
  return Safe.create({
    ethAdapter: ethAdapter,
    safeAddress: safeWallet.address,
  });
}

export function safeTxStateToAction(safeTxState: SafeTxState) {
  switch (safeTxState) {
    case SafeTxState.Executed:
      return 'Executed';
    case SafeTxState.Executing:
      return 'Replace';
    case SafeTxState.ReadyToExecute:
      return 'Execute';
    case SafeTxState.MissingSignature:
      return 'Sign';
    case SafeTxState.NotCreated:
      return 'Sign';
    case SafeTxState.Failed:
      return 'Partially Executed';
  }
}

export function getSafeTxStateFromSafeTransactionProposal(
  safeInfo: SafeInfoResponse,
  proposal: ISafeTransactionProposal,
) {
  const validConfirmations = validateSignatures(
    proposal.confirmations.map((conf) => conf.signer),
    safeInfo.owners,
  );
  const isReadyToExecute = safeInfo.threshold <= validConfirmations.length;
  if (proposal.state === IProposalState.Unsigned) {
    return SafeTxState.NotCreated;
  } else if (proposal.state === IProposalState.Executed) {
    return SafeTxState.Executed;
  } else if (isSafeTransactionProposalExecuting(proposal)) {
    return SafeTxState.Executing;
  } else if (proposal.state === IProposalState.Failed) {
    return SafeTxState.Failed;
  } else if (isReadyToExecute) {
    return SafeTxState.ReadyToExecute;
  } else {
    return SafeTxState.MissingSignature;
  }
}

export function isSafeTransactionProposalExecuting(
  proposal: ISafeTransactionProposal,
) {
  return (
    proposal.state === IProposalState.Executing ||
    proposal.state === IProposalState.Submitted
  );
}

export function isSafeMessageProposalReady(
  safeInfo: SafeInfoResponse,
  message: ISafeMessageProposal,
) {
  const validConfirmations = validateSignatures(
    message.confirmations.map((conf) => conf.signer),
    safeInfo.owners,
  );
  return safeInfo.threshold <= validConfirmations.length;
}

export function safeMessageProposalCompletedSignature(
  message: ISafeMessageProposal,
) {
  const signatures = [...message.confirmations]
    .sort((conf1, conf2) =>
      conf1.signer.toLowerCase().localeCompare(conf2.signer.toLowerCase()),
    )
    .map((conf) => conf.signature.slice(2));
  return `0x${signatures.join('')}`;
}

export async function safeTransactionFromProposal(
  safe: Safe,
  proposal: SafeTransactionProposalWithNonce,
): Promise<SafeTransaction> {
  // IMPORTANT:
  // data - has to be 0x - see https://ethereum.stackexchange.com/questions/109544/error-invalid-arrayify-value-argument-value-value-code-invalid-argumen
  // value - safe expect value to be integer string instead of hex
  const safeTransactionData: MetaTransactionData = {
    to: proposal.toAddress,
    value: BigInt(proposal.value).toString(),
    data: proposal.data || '0x',
    operation: proposal.operation,
  };
  const safeTransaction = await safe.createTransaction({
    transactions: [safeTransactionData],
    options: {
      nonce: proposal.safeNonce,
      safeTxGas: BigInt(proposal.safeTxGas).toString(),
      baseGas: BigInt(proposal.baseGas).toString(),
      gasPrice: BigInt(proposal.gasPrice).toString(),
      gasToken: proposal.gasToken,
      refundReceiver: proposal.refundReceiver,
    },
  });
  proposal.confirmations.forEach((confirmation) => {
    safeTransaction.addSignature(
      new EthSafeSignature(confirmation.signer, confirmation.signature),
    );
  });
  return safeTransaction;
}

export function getSafeMessageTypedData(
  chainId: number,
  address: string,
  messageHash: string,
) {
  const typedData = {
    types: {
      SafeMessage: [
        {
          name: 'message',
          type: 'bytes',
        },
      ],
    },
    primaryType: 'SafeMessage',
    domain: {
      chainId: chainId.toString(),
      verifyingContract: address.toLowerCase(),
    },
    message: {
      message: messageHash,
    },
  };
  return typedData;
}

export function getSafeTxTypedData(proposal: SafeTransactionProposalWithNonce) {
  const typedData = {
    types: {
      SafeTx: [
        { type: 'address', name: 'to' },
        { type: 'uint256', name: 'value' },
        { type: 'bytes', name: 'data' },
        { type: 'uint8', name: 'operation' },
        { type: 'uint256', name: 'safeTxGas' },
        { type: 'uint256', name: 'baseGas' },
        { type: 'uint256', name: 'gasPrice' },
        { type: 'address', name: 'gasToken' },
        { type: 'address', name: 'refundReceiver' },
        { type: 'uint256', name: 'nonce' },
      ],
    },
    domain: {
      verifyingContract: proposal.wallet.address,
      chainId: proposal.wallet.chainId,
    },
    primaryType: 'SafeTx',
    message: {
      value: proposal.value,
      safeTxGas: proposal.safeTxGas,
      baseGas: proposal.baseGas,
      gasPrice: proposal.gasPrice,
      nonce: proposal.safeNonce,
      data: proposal.data ?? '0x',
      gasToken: proposal.gasToken,
      operation: proposal.operation,
      refundReceiver: proposal.refundReceiver,
      to: proposal.toAddress,
    },
  };
  return typedData;
}

export function validateSignatures(signers: string[], owners: string[]) {
  const validOwners = owners.reduce<Record<string, boolean>>((obj, cur) => {
    obj[cur] = true;
    return obj;
  }, {});
  const validSigners = signers.filter((signer) => {
    const isValid = validOwners[signer];
    validOwners[signer] = false;
    return isValid;
  });
  return validSigners;
}

export function getPrevOwner(safeInfo: SafeInfoResponse, owner: string) {
  const index = safeInfo.owners
    .map((owner) => owner.toLowerCase())
    .indexOf(owner.toLowerCase());
  if (index === -1) {
    throw new Error('invalid address provided');
  } else if (index !== 0) {
    return safeInfo.owners[index - 1]!;
  } else {
    return safeSentinelAddress;
  }
}

export function getSafeApiKit(chainId: number) {
  return new SafeApiKit({
    chainId: BigInt(chainId),
    txServiceUrl:
      chainId === ChainId.Scroll
        ? 'https://safe-transaction-scroll.safe.global/api'
        : chainId === ChainId.ZkSync
        ? 'https://safe-transaction-zksync.safe.global/api'
        : undefined,
  });
}
