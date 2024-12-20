import {
  IExecuteTransactionProposalMutation,
  IMessageProposalType,
  ISafeMessageProposal,
  ITransactionProposalType,
  useConfirmMessageProposalMutation,
  useConfirmTransactionProposalMutation,
  useExecuteTransactionProposalMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { useMutationEmitter } from '../../common/hooks/query';
import { SafeTransactionProposalWithNonce } from '../../common/types';
import { retry } from '../../common/utils/functions';
import { graphqlType } from '../../graphql/types';
import { AbstractEthersSigner } from '../evm/ethers/types';
import { getSafeTxTransactionData } from './encode';
import { getSafeMessageTypedData, safeTransactionFromProposal } from './utils';

export function useConfirmSafeMessageProposal() {
  const confirmMessageProposalMutation = useMutationEmitter(
    [graphqlType.Message, graphqlType.Notification],
    useConfirmMessageProposalMutation(),
  );
  const mutateAsync = async (
    signer: AbstractEthersSigner,
    message: ISafeMessageProposal,
  ) => {
    const safeTypedData = getSafeMessageTypedData(
      message.wallet.chainId,
      message.wallet.address,
      message.messageHash,
    );
    const signature = await signer.signTypedData(
      safeTypedData.domain,
      safeTypedData.types,
      safeTypedData.message,
      safeTypedData.primaryType,
    );
    return confirmMessageProposalMutation.mutateAsync({
      input: {
        id: message.id,
        type: IMessageProposalType.Safe,
        safe: { signature },
      },
    });
  };
  return { mutateAsync };
}

export function useConfirmSafeTransactionProposal() {
  const confirmTransactionProposalMutation = useMutationEmitter(
    [graphqlType.Proposal, graphqlType.Notification],
    useConfirmTransactionProposalMutation(),
  );
  const mutateAsync = async (
    safe: Safe,
    proposal: SafeTransactionProposalWithNonce,
  ) => {
    const { signerSignature, safeNonce } = await confirmTransaction(
      safe,
      proposal,
    );
    return confirmTransactionProposalMutation.mutateAsync({
      input: {
        id: proposal.id,
        type: ITransactionProposalType.Safe,
        safe: {
          safeNonce,
          signature: signerSignature,
        },
      },
    });
  };
  return { mutateAsync };
}

export function useExecuteSafeTransactionProposal() {
  const executeSafeTransactionProposalMutation = useMutationEmitter(
    [graphqlType.Proposal, graphqlType.Notification],
    useExecuteTransactionProposalMutation(),
  );
  const mutateAsync = async (
    safe: Safe,
    proposal: SafeTransactionProposalWithNonce,
    options?: TransactionOptions,
  ): Promise<IExecuteTransactionProposalMutation> => {
    const response = await executeTransaction(safe, proposal, options);
    const input = {
      id: proposal.id,
      type: ITransactionProposalType.Safe,
      safe: { txHash: response.hash },
    };
    const createTx = () =>
      executeSafeTransactionProposalMutation.mutateAsync({
        input,
      });
    return retry(createTx).catch(() => ({
      executeTransactionProposal: {
        id: proposal.id,
        safe: { ...proposal, txHash: response.hash },
        type: ITransactionProposalType.Safe,
      },
    }));
  };
  return { mutateAsync };
}

async function confirmTransaction(
  safe: Safe,
  proposal: SafeTransactionProposalWithNonce,
) {
  const safeTransaction = await safeTransactionFromProposal(safe, proposal);
  const signedTransaction = await safe.signTransaction(safeTransaction);
  const signerAddress = (await safe.getEthAdapter().getSignerAddress())!;
  const signerSignature = signedTransaction.signatures.get(
    signerAddress!.toLowerCase(),
  )!.data;
  return {
    safeNonce: proposal.safeNonce,
    signerSignature,
  };
}

async function executeTransaction(
  safe: Safe,
  proposal: SafeTransactionProposalWithNonce,
  options?: TransactionOptions,
) {
  const ethAdapter = safe.getEthAdapter() as EthersAdapter;
  const signer = ethAdapter.getSigner()!;
  const isReplacement = !!proposal.txHash;
  const [safeTransaction, from, to, nonce] = await Promise.all([
    safeTransactionFromProposal(safe, proposal),
    signer.getAddress(),
    safe.getAddress(),
    signer.getNonce(isReplacement ? 'latest' : 'pending'),
  ]);
  const data = getSafeTxTransactionData(safe, safeTransaction);
  return signer.sendTransaction({
    ...options,
    from,
    to,
    data,
    nonce,
  });
}
