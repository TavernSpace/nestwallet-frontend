import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  AddressLookupTableAccount,
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { decode, encode } from 'bs58';
import { v4 } from 'uuid';
import { delay } from '../../../common/api/utils';
import { useMutationEmitter } from '../../../common/hooks/query';
import { Origin } from '../../../common/types';
import { empty, retry } from '../../../common/utils/functions';
import {
  ICreateTransactionProposalInput,
  ICryptoBalance,
  ITransactionMetadataInput,
  ITransactionProposal,
  ITransactionProposalType,
  IUpsertInteractedAddressInput,
  IWallet,
  useCreateTransactionProposalMutation,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { ChainId } from '../../chain';
import { tryParseSvmError } from '../../errors/svm';
import { createEphemeralTransactionProposal } from '../../proposal/utils';
import { IProtectedWalletClient } from '../../wallet/service/interface';
import {
  jitoTipAddress,
  nativeSolAddress,
  solFeeAddress,
  temporalTipAddress,
} from '../constants';
import { getJitoRpcUrl, getSolanaConnection, getSolanaRpcUrl } from '../utils';
import { SmartSolanaRpcClient } from './smart-client';

export function useCreateAndExecuteSvmTransaction(
  client: IProtectedWalletClient,
  wallet: IWallet,
) {
  const createTransactionProposalMutation = useMutationEmitter(
    [graphqlType.PendingTransaction],
    useCreateTransactionProposalMutation(),
  );

  const signTransaction = async (props: {
    data: string;
    origin?: Origin;
    interactedAddresses?: IUpsertInteractedAddressInput[];
    metadata: ITransactionMetadataInput[];
  }): Promise<ITransactionProposal> => {
    const { data, origin, interactedAddresses, metadata } = props;
    const signer = await client.getSvmSigner(wallet.chainId, wallet);
    const signatures = await signer.signTransactions([data]);
    const signature = signatures[0]!;

    const result = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.SvmKey,
        svmKey: {
          walletId: wallet.id,
          chainId: ChainId.Solana,
          data: data,
          originName: origin?.title,
          originImageURL: origin?.favIconUrl,
          originURL: origin?.url,
          txHash: signature,
        },
        interactedAddresses,
        metadata,
      },
    });
    return result.createTransactionProposal as ITransactionProposal;
  };

  const signAndSendTransaction = async (props: {
    data: string;
    origin?: Origin;
    interactedAddresses?: IUpsertInteractedAddressInput[];
    metadata: ITransactionMetadataInput[];
  }): Promise<ITransactionProposal> => {
    const { data, origin, interactedAddresses, metadata } = props;
    const signer = await client.getSvmSigner(wallet.chainId, wallet);
    const signatures = await signer.signTransactions([data]);
    const signature = signatures[0]!;

    const connection = getSolanaConnection();
    const transaction = VersionedTransaction.deserialize(decode(data));

    transaction.addSignature(new PublicKey(wallet.address), decode(signature));
    await connection.sendTransaction(transaction, {
      skipPreflight: true,
      maxRetries: 0,
    });

    const input = {
      type: ITransactionProposalType.SvmKey,
      svmKey: {
        walletId: wallet.id,
        chainId: ChainId.Solana,
        data: data,
        originName: origin?.title,
        originImageURL: origin?.favIconUrl,
        originURL: origin?.url,
        txHash: signature,
      },
      interactedAddresses,
      metadata,
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

  const addFeesAndSendTransaction = async (props: {
    data: string;
    amount: string;
    feeAsset: ICryptoBalance;
    fee: number;
    estimateCU?: boolean;
    computePrice?: bigint | boolean;
    origin?: Origin;
    interactedAddresses?: IUpsertInteractedAddressInput[];
    mev: boolean;
    simulate: boolean;
    tip?: bigint;
    metadata: ITransactionMetadataInput[];
  }): Promise<ITransactionProposal> => {
    const {
      data,
      amount,
      feeAsset,
      fee,
      origin,
      estimateCU = false,
      computePrice,
      interactedAddresses,
      simulate,
      mev,
      tip,
      metadata,
    } = props;
    const connection = getSolanaConnection();
    const transaction = VersionedTransaction.deserialize(decode(data));
    const pubKey = new PublicKey(wallet.address);

    const hasFee = amount !== '0' && fee !== 0;
    const hasTip = !!tip && tip > 0n;
    const hasMev = mev && hasTip;
    const hasTemporal = hasTip && tip >= 1_000_000n;
    const singularTx = hasMev || hasTip;

    const addressLookupTableAccounts = await Promise.all(
      transaction!.message.addressTableLookups.map(async (lookup) => {
        return new AddressLookupTableAccount({
          key: lookup.accountKey,
          state: AddressLookupTableAccount.deserialize(
            await connection
              .getAccountInfo(lookup.accountKey)
              .then((res) => res!.data),
          ),
        });
      }),
    );
    const message = TransactionMessage.decompile(transaction.message, {
      addressLookupTableAccounts: addressLookupTableAccounts,
    });

    if (hasFee) {
      const feeInstructions =
        feeAsset.address === nativeSolAddress
          ? getSolTransferTransactionIx({
              fromPubkey: pubKey,
              amount,
              fee,
            })
          : getTokenTransferTransactionIx({
              fromPubkey: pubKey,
              amount,
              mintPubkey: new PublicKey(feeAsset.address),
              fee,
            });
      message.instructions.push(...feeInstructions);
    }

    if (hasTemporal) {
      message.instructions.push(getTemporalTipInstruction(pubKey, tip));
    } else if (singularTx) {
      message.instructions.push(getJitoTipInstruction(pubKey, tip));
    }

    if (typeof computePrice === 'bigint') {
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: computePrice,
      });
      message.instructions.splice(1, 1, computeBudgetIx);
    } else if (typeof computePrice === 'boolean' && computePrice) {
      const client = new SmartSolanaRpcClient();
      const priorityFeeRecommendation = await client
        .getMedianPriorityFee(95, [
          'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        ])
        .then((amount) => Math.floor(amount * 1.2));
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.min(priorityFeeRecommendation, 20_000_000),
      });
      message.instructions.splice(1, 1, computeBudgetIx);
    }

    const limit = getComputeUnitLimit(message.instructions);
    if (estimateCU || limit === 1_400_000) {
      await estimateComputeUnits(
        message.instructions,
        pubKey,
        addressLookupTableAccounts,
      );
    }

    if (simulate) {
      const rpcClient = new SmartSolanaRpcClient();
      const result = await rpcClient.simulateTransaction(
        message.instructions,
        pubKey,
        addressLookupTableAccounts,
        false,
      );
      if (result.value.err) {
        const svmError = tryParseSvmError(result.value.err);
        throw new Error(
          svmError ? svmError.message : JSON.stringify(result.value.err),
        );
      }
    }

    transaction.message = message.compileToV0Message(
      addressLookupTableAccounts,
    );
    const signer = await client.getSvmSigner(wallet.chainId, wallet);
    const [mainSig] = await signer.signTransactions([
      encode(transaction.serialize()),
    ]);
    transaction.addSignature(new PublicKey(wallet.address), decode(mainSig!));
    if (hasTemporal && hasMev) {
      // Send to Temporal through our backend
      await sendTransaction(transaction, getSolanaRpcUrl(), 'private');
    } else if (hasMev) {
      // Send to Jito only
      await sendTransaction(transaction, getJitoRpcUrl(false));
      const handleRetry = async () => {
        for (let i = 0; i < 5; i++) {
          await delay(i < 3 ? 1000 : (i - 2) * 1000);
          await sendTransaction(transaction, getJitoRpcUrl(false));
        }
      };
      handleRetry().catch(empty);
    } else if (singularTx) {
      // Send to Jito and our backend
      await sendTransaction(
        transaction,
        getSolanaRpcUrl(),
        hasTemporal ? 'optimized' : 'default',
      );
      const propogateJito = async () => {
        for (let i = 0; i < 5; i++) {
          await sendTransaction(transaction, getJitoRpcUrl(true));
          await delay(i < 3 ? 1000 : (i - 2) * 1000);
        }
      };
      if (!hasTemporal) {
        propogateJito().catch(empty);
      }
    } else {
      // Send to our backend normally
      await sendTransaction(transaction, getSolanaRpcUrl());
    }

    const input: ICreateTransactionProposalInput = {
      type: ITransactionProposalType.SvmKey,
      svmKey: {
        walletId: wallet.id,
        chainId: ChainId.Solana,
        data: data,
        originName: origin?.title,
        originImageURL: origin?.favIconUrl,
        originURL: origin?.url,
        txHash: mainSig,
        private: hasMev,
      },
      interactedAddresses,
      metadata,
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
    signTransaction,
    signAndSendTransaction,
    addFeesAndSendTransaction,
  };
}

function getSolTransferTransactionIx(props: {
  fromPubkey: PublicKey;
  amount: string;
  fee: number;
}) {
  const { fromPubkey, amount, fee } = props;
  const FEE_PUBKEY = new PublicKey(solFeeAddress);
  // NOTE: DON'T REORDER THIS, order matters to prevent rounding issues
  const bigAmount = BigInt(amount);
  const sendAmount =
    (bigAmount * 10000n - bigAmount * BigInt(fee * 10000)) / 10000n;
  const feeAmount = bigAmount - sendAmount;
  return [
    SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: FEE_PUBKEY,
      lamports: feeAmount,
    }),
  ];
}

function getTokenTransferTransactionIx(props: {
  fromPubkey: PublicKey;
  amount: string;
  mintPubkey: PublicKey;
  fee: number;
}) {
  const { fromPubkey, amount, mintPubkey, fee } = props;
  const instructions = [];
  const FEE_PUBKEY = new PublicKey(solFeeAddress);

  const fromTokenAccount = getAssociatedTokenAddressSync(
    mintPubkey,
    fromPubkey,
  );
  const toTokenAccount = getAssociatedTokenAddressSync(mintPubkey, FEE_PUBKEY);
  const createToTokenAccountIx =
    createAssociatedTokenAccountIdempotentInstruction(
      fromPubkey,
      toTokenAccount,
      FEE_PUBKEY,
      mintPubkey,
    );
  instructions.push(createToTokenAccountIx);

  const bigAmount = BigInt(amount);
  const sendAmount =
    (bigAmount * 10000n - bigAmount * BigInt(fee * 10000)) / 10000n;
  const feeAmount = bigAmount - sendAmount;
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromPubkey,
    feeAmount,
  );
  instructions.push(transferInstruction);
  return instructions;
}

function getJitoTipInstruction(fromPubkey: PublicKey, tip: bigint) {
  return SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: new PublicKey(jitoTipAddress),
    lamports: tip,
  });
}

function getTemporalTipInstruction(fromPubkey: PublicKey, tip: bigint) {
  return SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: new PublicKey(temporalTipAddress),
    lamports: tip,
  });
}

async function estimateComputeUnits(
  instructions: TransactionInstruction[],
  pubKey: PublicKey,
  addressLookupTableAccounts: AddressLookupTableAccount[],
) {
  const computeBudgetInstructionIndex = instructions.findIndex((ix) => {
    // Assuming it's a ComputeBudgetInstruction by the programId
    return ix.programId.equals(ComputeBudgetProgram.programId);
  });
  if (computeBudgetInstructionIndex !== -1) {
    // removes the instruction
    instructions.splice(computeBudgetInstructionIndex, 1);
  }

  const rpcClient = new SmartSolanaRpcClient();
  const units = await rpcClient.getComputeUnits(
    instructions,
    pubKey,
    addressLookupTableAccounts,
  );

  if (!units) {
    throw new Error('Failed to estimate compute units');
  }

  const customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.3);

  const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: customersCU,
  });
  if (computeBudgetInstructionIndex !== -1) {
    instructions.splice(computeBudgetInstructionIndex, 0, computeUnitsIx);
  } else {
    instructions.unshift(computeUnitsIx);
  }
}

async function sendTransaction(
  transaction: VersionedTransaction,
  url: string,
  type: 'default' | 'private' | 'optimized' = 'default',
): Promise<void> {
  const tx = Buffer.from(transaction.serialize()).toString('base64');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: v4(),
      method:
        type === 'private'
          ? 'sendPrivateTransaction'
          : type === 'optimized'
          ? 'sendOptimizedTransaction'
          : 'sendTransaction',
      params: [
        tx,
        {
          encoding: 'base64',
          maxRetries: 0,
          preflightCommitment: 'finalized',
          skipPreflight: true,
        },
      ],
    }),
  });

  if (response.status >= 400) {
    throw new Error('Failed to submit transaction, please try again');
  }

  const data = await response.json();
  if (data.error && typeof data.error === 'string') {
    throw new Error(data.error);
  } else if (data.error && typeof data.error.message === 'string') {
    throw new Error(data.error.message);
  } else if (!data.result) {
    throw new Error('Failed to submit transaction, please try again');
  }
}

function getComputeUnitLimit(instructions: TransactionInstruction[]) {
  const computeBudgetInstructionIndex = instructions.findIndex((ix) =>
    ix.programId.equals(ComputeBudgetProgram.programId),
  );
  if (computeBudgetInstructionIndex !== -1) {
    const params = ComputeBudgetInstruction.decodeSetComputeUnitLimit(
      instructions[computeBudgetInstructionIndex]!,
    );
    return params.units;
  } else {
    return 1_400_000;
  }
}
