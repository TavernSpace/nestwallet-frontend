import _ from 'lodash';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import {
  ExternalTransactionProposal,
  SafeTransactionProposalWithNonce,
} from '../../common/types';
import { id } from '../../common/utils/functions';
import {
  ICreateTransactionProposalInput,
  ICreateTransactionProposalMutation,
  IEthKeyMessageProposal,
  IEthKeyTransactionProposal,
  IMessageProposal,
  IMessageProposalType,
  IProposalState,
  ISafeMessageProposal,
  ISafeTransactionProposal,
  ISvmKeyMessageProposal,
  ISvmKeyTransactionProposal,
  ITransactionProposal,
  ITransactionProposalType,
  ITransactionStatus,
  ITvmKeyMessageProposal,
  ITvmKeyTransactionProposal,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { onBlockchain } from '../chain';

export function walletTransactionProposalType(wallet: IWallet) {
  if (wallet.type === IWalletType.Safe) {
    return ITransactionProposalType.Safe;
  } else {
    return onBlockchain(wallet.blockchain)(
      () => ITransactionProposalType.EthKey,
      () => ITransactionProposalType.SvmKey,
      () => ITransactionProposalType.TvmKey,
    );
  }
}

export function walletMessageProposalType(wallet: IWallet) {
  if (wallet.type == IWalletType.Safe) {
    return IMessageProposalType.Safe;
  } else {
    return onBlockchain(wallet.blockchain)(
      () => IMessageProposalType.EthKey,
      () => IMessageProposalType.SvmKey,
      () => IMessageProposalType.TvmKey,
    );
  }
}

export function isSafeTransactionProposalComplete(
  proposal: ISafeTransactionProposal,
) {
  return (
    proposal.state === IProposalState.Executed ||
    proposal.state === IProposalState.Failed ||
    proposal.state === IProposalState.Invalid
  );
}

export function safeTransactionProposalHasNonce(
  proposal: ISafeTransactionProposal,
): proposal is SafeTransactionProposalWithNonce {
  return !_.isNil(proposal.safeNonce);
}

export function onTransactionProposal(transaction: ITransactionProposal) {
  return <TSafe, TEvm, TSvm, TTvm>(
    onSafe: (tx: ISafeTransactionProposal) => TSafe,
    onEvm: (tx: IEthKeyTransactionProposal) => TEvm,
    onSvm: (tx: ISvmKeyTransactionProposal) => TSvm,
    onTvm: (tx: ITvmKeyTransactionProposal) => TTvm,
  ) => {
    if (transaction.type === ITransactionProposalType.Safe) {
      return onSafe(transaction.safe!);
    } else if (transaction.type === ITransactionProposalType.EthKey) {
      return onEvm(transaction.ethKey!);
    } else if (transaction.type === ITransactionProposalType.SvmKey) {
      return onSvm(transaction.svmKey!);
    } else {
      return onTvm(transaction.tvmKey!);
    }
  };
}

export function onExternalTransactionProposal(
  transaction: ITransactionProposal,
) {
  return <TEvm, TSvm, TTvm>(
    onEvm: (tx: IEthKeyTransactionProposal) => TEvm,
    onSvm: (tx: ISvmKeyTransactionProposal) => TSvm,
    onTvm: (tx: ITvmKeyTransactionProposal) => TTvm,
  ) => {
    if (transaction.type === ITransactionProposalType.EthKey) {
      return onEvm(transaction.ethKey!);
    } else if (transaction.type === ITransactionProposalType.SvmKey) {
      return onSvm(transaction.svmKey!);
    } else if (transaction.type === ITransactionProposalType.TvmKey) {
      return onTvm(transaction.tvmKey!);
    } else {
      throw new Error('Invalid proposal found');
    }
  };
}

export function createEphemeralTransactionProposal(
  wallet: IWallet,
  input: ICreateTransactionProposalInput,
): ICreateTransactionProposalMutation {
  const id = v4();
  const submittedAt = DateTime.now().toISO();
  if (input.type === ITransactionProposalType.EthKey) {
    const data = input.ethKey!;
    const ethKey: IEthKeyTransactionProposal = {
      wallet,
      value: data.value,
      txHash: data.txHash,
      toAddress: data.toAddress,
      submittedAt,
      status: ITransactionStatus.Pending,
      nonce: data.nonce,
      isPrivate: false,
      id,
      data: data.data,
      chainId: data.chainId,
    };
    return {
      createTransactionProposal: {
        id,
        type: input.type,
        ethKey,
      },
    };
  } else if (input.type === ITransactionProposalType.SvmKey) {
    const data = input.svmKey!;
    const svmKey: ISvmKeyTransactionProposal = {
      wallet,
      txHash: data.txHash,
      submittedAt,
      status: ITransactionStatus.Pending,
      id,
      data: data.data,
      chainId: data.chainId,
    };
    return {
      createTransactionProposal: {
        id: v4(),
        type: input.type,
        svmKey,
      },
    };
  } else if (input.type === ITransactionProposalType.TvmKey) {
    const data = input.tvmKey!;
    const tvmKey: ITvmKeyTransactionProposal = {
      wallet,
      value: '',
      txHash: data.txHash,
      toAddress: data.toAddress,
      submittedAt,
      status: ITransactionStatus.Pending,
      seqno: data.seqno,
      sendMode: data.sendMode,
      id,
      data: data.data,
      chainId: data.chainId,
    };
    return {
      createTransactionProposal: {
        id: v4(),
        type: input.type,
        tvmKey,
      },
    };
  } else {
    throw new Error('invalid proposal type');
  }
}

export function onMessageProposal(message: IMessageProposal) {
  return <TSafe, TEvm, TSvm, TTvm>(
    onSafe: (tx: ISafeMessageProposal) => TSafe,
    onEvm: (tx: IEthKeyMessageProposal) => TEvm,
    onSvm: (tx: ISvmKeyMessageProposal) => TSvm,
    onTvm: (tx: ITvmKeyMessageProposal) => TTvm,
  ) => {
    if (message.type === IMessageProposalType.Safe) {
      return onSafe(message.safe!);
    } else if (message.type === IMessageProposalType.EthKey) {
      return onEvm(message.ethKey!);
    } else if (message.type === IMessageProposalType.SvmKey) {
      return onSvm(message.svmKey!);
    } else {
      return onTvm(message.tvmKey!);
    }
  };
}

export function resolveTransactionProposal(transaction: ITransactionProposal) {
  return onTransactionProposal(transaction)(id, id, id, id);
}

export function resolveExternalTransactionProposal(
  transaction: ITransactionProposal,
) {
  return onExternalTransactionProposal(transaction)(id, id, id);
}

export function resolveMessageProposal(message: IMessageProposal) {
  return onMessageProposal(message)(id, id, id, id);
}

export function tagSafeTransactionProposal(
  tx: ISafeTransactionProposal,
): ITransactionProposal {
  return { id: tx.id, type: ITransactionProposalType.Safe, safe: tx };
}

export function tagEthKeyTransactionProposal(
  tx: IEthKeyTransactionProposal,
): ITransactionProposal {
  return { id: tx.id, type: ITransactionProposalType.EthKey, ethKey: tx };
}

export function tagSvmKeyTransactionProposal(
  tx: ISvmKeyTransactionProposal,
): ITransactionProposal {
  return { id: tx.id, type: ITransactionProposalType.SvmKey, svmKey: tx };
}

export function tagTvmKeyTransactionProposal(
  tx: ITvmKeyTransactionProposal,
): ITransactionProposal {
  return { id: tx.id, type: ITransactionProposalType.TvmKey, tvmKey: tx };
}

export function tagExternalTransactionProposal(
  tx: ExternalTransactionProposal,
  type: ITransactionProposalType,
): ITransactionProposal {
  if (type === ITransactionProposalType.TvmKey) {
    return tagTvmKeyTransactionProposal(tx as ITvmKeyTransactionProposal);
  } else if (type === ITransactionProposalType.SvmKey) {
    return tagSvmKeyTransactionProposal(tx as ISvmKeyTransactionProposal);
  } else {
    return tagEthKeyTransactionProposal(tx as IEthKeyTransactionProposal);
  }
}

export function tagSafeMessageProposal(
  message: ISafeMessageProposal,
): IMessageProposal {
  return { id: message.id, type: IMessageProposalType.Safe, safe: message };
}

export function tagEthKeyMessageProposal(
  message: IEthKeyMessageProposal,
): IMessageProposal {
  return { id: message.id, type: IMessageProposalType.EthKey, ethKey: message };
}

export function filterPendingSafeTransactionProposals(
  proposals: ISafeTransactionProposal[],
  safeNonce: number,
) {
  return proposals
    .filter((proposal) => {
      const isValidNonce =
        _.isNil(proposal.safeNonce) || proposal.safeNonce >= safeNonce;
      return !isSafeTransactionProposalComplete(proposal) && isValidNonce;
    })
    .sort(
      (proposal, otherProposal) =>
        (proposal.safeNonce ?? Infinity) -
          (otherProposal.safeNonce ?? Infinity) ||
        DateTime.fromISO(otherProposal.createdAt).toUnixInteger() -
          DateTime.fromISO(proposal.createdAt).toUnixInteger(),
    );
}

export function filterPendingSafeMessageProposals(
  messages: ISafeMessageProposal[],
) {
  return messages.sort(
    (message, otherMessage) =>
      // TODO: how do we want to sort pending messages?
      DateTime.fromISO(otherMessage.createdAt).toUnixInteger() -
      DateTime.fromISO(message.createdAt).toUnixInteger(),
  );
}
