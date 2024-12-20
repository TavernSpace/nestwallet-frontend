import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { useMutationEmitter } from '../../../common/hooks/query';
import { Origin, TransactionParams } from '../../../common/types';
import { retry } from '../../../common/utils/functions';
import { IProtectedWalletClient } from '../../../features/wallet/service/interface';
import {
  ICreateTransactionProposalInput,
  IEthKeyTransactionProposal,
  ITransactionMetadataInput,
  ITransactionProposal,
  ITransactionProposalType,
  IUpsertInteractedAddressInput,
  IWallet,
  useCreateTransactionProposalMutation,
  useExecuteTransactionProposalMutation,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { createEphemeralTransactionProposal } from '../../proposal/utils';

export function useCreateAndExecuteEthKeyTransaction(
  walletClient: IProtectedWalletClient,
  wallet: IWallet,
) {
  const createTransactionProposalMutation = useMutationEmitter(
    [graphqlType.PendingTransaction],
    useCreateTransactionProposalMutation(),
  );

  const executeTransaction = async (props: {
    transaction: TransactionParams;
    transactionOptions: TransactionOptions;
    origin?: Origin;
    isPrivate?: boolean;
    interactedAddresses?: IUpsertInteractedAddressInput[];
    metadata: ITransactionMetadataInput[];
  }): Promise<ITransactionProposal> => {
    const {
      transaction,
      transactionOptions,
      origin,
      isPrivate = false,
      interactedAddresses,
      metadata,
    } = props;
    const signer = await walletClient.getEvmSigner(
      transaction.chainId,
      wallet,
      true,
      isPrivate,
    );
    const nonce = transactionOptions.nonce
      ? transactionOptions.nonce
      : await signer.getNonce('pending');
    const txResponse = await signer.sendTransaction({
      ...transactionOptions,
      from: transaction.from,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
      type: transactionOptions.gasPrice ? 0 : 2,
      chainId: transaction.chainId,
      nonce,
    });
    const input: ICreateTransactionProposalInput = {
      type: ITransactionProposalType.EthKey,
      ethKey: {
        walletId: wallet.id,
        chainId: transaction.chainId,
        toAddress: transaction.to,
        value: transaction.value,
        data: transaction.data,
        originName: origin?.title,
        originImageURL: origin?.favIconUrl,
        originURL: origin?.url,
        nonce: txResponse.nonce,
        txHash: txResponse.hash,
        private: isPrivate,
      },
      metadata,
      interactedAddresses,
    };
    const createTx = () =>
      createTransactionProposalMutation.mutateAsync({
        input,
      });
    const result = await retry(createTx).catch(() =>
      createEphemeralTransactionProposal(wallet, input),
    );
    return result.createTransactionProposal as ITransactionProposal;
  };

  return {
    executeTransaction,
  };
}

export function useExecuteEthKeyTransactionProposal() {
  const executeTransactionProposalMutation = useMutationEmitter(
    [graphqlType.PendingTransaction],
    useExecuteTransactionProposalMutation(),
  );
  const mutateAsync = async (
    transaction: IEthKeyTransactionProposal,
    txResponse: ethers.TransactionResponse,
  ) => {
    return executeTransactionProposalMutation.mutateAsync({
      input: {
        id: transaction.id,
        type: ITransactionProposalType.EthKey,
        ethKey: {
          nonce: txResponse.nonce,
          txHash: txResponse.hash,
          private: transaction.isPrivate,
        },
      },
    });
  };
  return { mutateAsync };
}
