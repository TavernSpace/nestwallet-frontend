import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { decode } from 'bs58';
import { zip } from 'lodash';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { Loadable, TransactionParams } from '../../common/types';
import { ChainId } from '../../features/chain';
import { cryptoKey } from '../../features/crypto/utils';
import { useCreateAndExecuteEthKeyTransaction } from '../../features/evm/transaction/execute';
import { useCreateAndExecuteSvmTransaction } from '../../features/svm/transaction/execute';
import { getSolanaConnection } from '../../features/svm/utils';
import { SwapRoute } from '../../features/swap/types';
import { useCreateAndExecuteTvmTransaction } from '../../features/tvm/transaction/execute';
import { IProtectedWalletClient } from '../../features/wallet/service/interface';
import {
  ICryptoBalance,
  ILimitOrderType,
  ISwapType,
  ITransactionMetadataInput,
  ITransactionProposal,
  ITransactionStatus,
  IWallet,
  useCreateLimitOrderMutation,
} from '../../graphql/client/generated/graphql';
import { useExecutionContext } from '../../provider/execution';
import { useCreateSwapProposalMutation } from '../swap/utils';
import {
  ILimitOrderInput,
  QuickTradeLimitTransactionMetadata,
  QuickTradeTransactionMetadata,
  SpotForm,
} from './types';
import { useVerifyQuickTradeTransactions } from './utils';

export function useTradeMutations(
  wallet: IWallet,
  client: IProtectedWalletClient,
  onSafe: (wallet: IWallet, proposal: ITransactionProposal) => void,
) {
  const { expand } = useExecutionContext();

  const { executeTransaction: executeEVMTransaction } =
    useCreateAndExecuteEthKeyTransaction(client, wallet);
  const {
    addFeesAndSendTransaction: executeSVMTransaction,
    signTransaction: signSVMTransaction,
  } = useCreateAndExecuteSvmTransaction(client, wallet);
  const { executeTransaction: executeTVMTransaction } =
    useCreateAndExecuteTvmTransaction(client, wallet);
  const { mutate: createSafeTransaction } =
    useCreateSwapProposalMutation(wallet);
  const createLimitOrderMutation = useCreateLimitOrderMutation();

  const [additionalAssets, setAdditionalAssets] = useState<
    Record<string, Record<string, ICryptoBalance>>
  >({});

  // TODO: what if one submits successfully and one doesn't?
  // Need to track all pending tx here, and update states locally.
  // e.g. which tokens have approval txs pending, then there is no need to try to submit it again
  const executeSpot = async (
    transactions: TransactionParams[],
    options: TransactionOptions[],
    tradeMetadata: QuickTradeTransactionMetadata[],
    feeAmount: string,
    feeAsset: ICryptoBalance,
    feeBps: number,
    metadata: ITransactionMetadataInput[],
    mev: boolean,
    simulate: boolean,
    estimateCU: boolean = false,
    computePrice?: bigint | boolean,
    onApproved?: VoidFunction,
    tip?: bigint,
  ) => {
    const chainId = transactions[0]?.chainId;
    // Note: we can pass in the entire metadata into non-evm since only evm chains have approvals
    const proposals: ITransactionProposal[] = [];
    if (chainId === ChainId.Ton) {
      const proposal = await executeTVMTransaction({
        messages: transactions.map((tx) => ({
          address: tx.to,
          amount: BigInt(tx.value),
          body: tx.data,
          bounce: true,
        })),
        metadata,
      });
      proposals.push(proposal);
    } else if (chainId === ChainId.Solana) {
      for (const transaction of transactions) {
        const proposal = await executeSVMTransaction({
          data: transaction.data,
          amount: feeAmount,
          feeAsset,
          fee: feeBps / 10_000,
          estimateCU,
          computePrice,
          mev,
          simulate,
          tip,
          metadata,
        });
        proposals.push(proposal);
      }
    } else {
      for (const [index, [transaction, option]] of zip(
        transactions,
        options,
      ).entries()) {
        const isApproval = index === 0 && transactions.length > 1;
        const transactionInput = {
          walletId: wallet.id,
          chainId: transaction!.chainId,
          from: wallet.address,
          to: transaction!.to,
          data: transaction!.data,
          value: transaction!.value,
        };
        const proposal = await executeEVMTransaction({
          transaction: transactionInput,
          transactionOptions: option!,
          isPrivate:
            !isApproval && transaction!.chainId === ChainId.Ethereum && mev,
          metadata: metadata[index] ? [metadata[index]!] : [],
        });
        if (isApproval) {
          onApproved?.();
        }
        proposals.push(proposal);
      }
    }
    const walletAdditionalAssets = {
      ...additionalAssets[wallet.address],
    };
    const newAdditionalAssets = {
      ...additionalAssets,
    };
    tradeMetadata.forEach((data) => {
      if (data.type === 'spot') {
        walletAdditionalAssets[cryptoKey(data.toToken)] = data.toToken;
        walletAdditionalAssets[cryptoKey(data.fromToken)] = data.fromToken;
      }
    });
    newAdditionalAssets[wallet.address] = walletAdditionalAssets;
    setAdditionalAssets(newAdditionalAssets);
    expand(ITransactionStatus.Pending);
  };

  const executeLimit = async (
    input: ILimitOrderInput,
    transaction: TransactionParams,
    tradeMetadata: QuickTradeLimitTransactionMetadata,
    metadata: ITransactionMetadataInput,
  ) => {
    if (transaction.chainId !== ChainId.Solana) {
      throw new Error('Unsupported network for limit order');
    }
    const proposal = await signSVMTransaction({
      data: transaction.data,
      metadata: [metadata],
    });
    const signature = proposal.svmKey!.txHash!;
    await createLimitOrderMutation.mutateAsync({
      input: {
        chainId: transaction.chainId,
        slippageBps: Math.round(input.slippage * 100),
        expiresAt: input.expiration
          ? DateTime.fromSeconds(input.expiration).toISO()
          : undefined,
        fromTokenAddress: tradeMetadata.fromToken.address,
        fromTokenAmount: tradeMetadata.fromAmount,
        fundingTxHash: signature,
        orderType:
          tradeMetadata.mode === 'buy'
            ? ILimitOrderType.Buy
            : ILimitOrderType.Sell,
        targetPrice: parseFloat(input.targetPrice),
        toTokenAddress: tradeMetadata.toToken.address,
        walletId: wallet.id,
      },
    });
    const connection = getSolanaConnection();
    const tx = VersionedTransaction.deserialize(decode(transaction.data));
    tx.addSignature(new PublicKey(wallet.address), decode(signature));
    await connection.sendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 0,
    });
    expand(ITransactionStatus.Pending);
  };

  const executeSafeSpot = async (
    spotForm: SpotForm,
    route: Loadable<SwapRoute | null>,
    swapType: ISwapType,
  ) => {
    const proposal = await createSafeTransaction(
      spotForm.values,
      route.data!,
      swapType,
    );
    if (proposal) {
      onSafe(wallet, proposal);
    }
  };

  useVerifyQuickTradeTransactions(wallet);

  return {
    executeSpot,
    executeLimit,
    executeSafeSpot,
    additionalAssets: additionalAssets[wallet.address] ?? {},
  };
}
