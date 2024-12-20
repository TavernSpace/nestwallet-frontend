import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { parseError } from '../../errors';
import { tryParseSvmError } from '../../errors/svm';
import { getSolanaConnection } from '../utils';
import {
  GetRecentPrioritizationFeesRequest,
  GetRecentPrioritizationFeesResponse,
} from './types';

// For calculating the priority fee
export const LAMPORTS_TO_MICRO_LAMPORTS = 10 ** 6;
export const MINIMUM_TOTAL_PFEE_LAMPORTS = 10_000;

export class SmartSolanaRpcClient {
  connection: Connection;

  constructor() {
    this.connection = getSolanaConnection();
  }

  // reference: https://github.com/helius-labs/helius-sdk/blob/be2079877125b68645f0df9addbf81a96b39ff0b/src/RpcClient.ts#L514
  async buildSmartTransaction(
    instructions: TransactionInstruction[],
    fromKeypair: PublicKey,
    lookupTables: AddressLookupTableAccount[] = [],
    accountKeys: string[] = [],
    priorityLimit = 20_000_000,
    percentile = 95,
    computeUnitPrice?: bigint,
  ): Promise<string> {
    // Check if any of the instructions provided set the compute unit price and/or limit, and throw an error if true
    const existingComputeBudgetInstructions = instructions.filter(
      (instruction) =>
        instruction.programId.equals(ComputeBudgetProgram.programId),
    );

    if (existingComputeBudgetInstructions.length > 0) {
      throw new Error(
        'Cannot provide instructions that set the compute unit price and/or limit',
      );
    }

    // For building the transaction
    const pubKey = fromKeypair;
    const recentBlockhash = await this.connection
      .getLatestBlockhash()
      .then((block) => block.blockhash);

    // Determine if we need to use a versioned transaction
    const isVersioned = lookupTables.length > 0;

    // Get the optimal compute units
    const units = await this.getComputeUnits(
      instructions,
      pubKey,
      isVersioned ? lookupTables : [],
    );

    if (!units) {
      throw new Error('Failed to estimate compute units');
    }

    // For very small transactions, such as simple transfers, default to 1k CUs
    const customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.3);
    if (computeUnitPrice) {
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: computeUnitPrice,
      });
      instructions.unshift(computeBudgetIx);
    } else {
      const priorityFeeRecommendation = await this.getMedianPriorityFee(
        percentile,
        accountKeys,
      ).then((amount) => Math.floor(amount * 1.2));
      const microlamportsPerCU = Math.min(
        Math.max(
          priorityFeeRecommendation,
          Math.round(
            (MINIMUM_TOTAL_PFEE_LAMPORTS / customersCU) *
              LAMPORTS_TO_MICRO_LAMPORTS,
          ),
        ),
        priorityLimit,
      );
      // Add the compute unit price instruction with the estimated fee
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: microlamportsPerCU,
      });
      instructions.unshift(computeBudgetIx);
    }
    const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: customersCU,
    });
    instructions.unshift(computeUnitsIx);

    if (isVersioned) {
      const v0Message = new TransactionMessage({
        instructions: instructions,
        payerKey: pubKey,
        recentBlockhash: recentBlockhash,
      }).compileToV0Message(lookupTables);
      const optimizedTransaction = new VersionedTransaction(v0Message);
      return bs58.encode(optimizedTransaction.serialize());
    } else {
      const optimizedTransaction = new Transaction().add(...instructions);
      optimizedTransaction.recentBlockhash = recentBlockhash;
      optimizedTransaction.feePayer = pubKey;
      return bs58.encode(
        optimizedTransaction.serialize({ verifySignatures: false }),
      );
    }
  }

  public async getComputeUnits(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    lookupTables: AddressLookupTableAccount[],
  ): Promise<number | null> {
    const rpcResponse = await this.simulateTransaction(
      instructions,
      payer,
      lookupTables,
    );

    if (rpcResponse.value.err) {
      const svmError = tryParseSvmError(rpcResponse.value.err);
      throw new Error(
        svmError ? svmError.message : JSON.stringify(rpcResponse.value.err),
      );
    }

    return rpcResponse.value.unitsConsumed || null;
  }

  public async simulateTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    lookupTables: AddressLookupTableAccount[],
    overwriteComputeLimit = true,
  ) {
    const testInstructions = overwriteComputeLimit
      ? [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
          ...instructions,
        ]
      : [...instructions];

    const testTransaction = new VersionedTransaction(
      new TransactionMessage({
        instructions: testInstructions,
        payerKey: payer,
        // Genesis hash as placeholder
        recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirAn',
      }).compileToV0Message(lookupTables),
    );

    return this.connection.simulateTransaction(testTransaction, {
      replaceRecentBlockhash: true,
      sigVerify: false,
      commitment: 'confirmed',
    });
  }

  public getMedianPriorityFee = async (
    percentile: number,
    accountKeys: string[],
  ) => {
    const result = await this.getRecentPrioritizationFees({
      accountKeys,
      percentile,
    });
    const offset = 100000;
    const med = Math.floor(
      median(
        result.map((item) => item.prioritizationFee),
        100000,
      ),
    );
    return med + offset;
  };

  public getRecentPrioritizationFees = async (
    params: GetRecentPrioritizationFeesRequest,
  ): Promise<GetRecentPrioritizationFeesResponse> => {
    try {
      const url = `${this.connection.rpcEndpoint}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getRecentPrioritizationFees',
          params: [params.accountKeys, { percentile: params.percentile * 100 }],
        }),
      });
      const data = await resp.json();
      if (data.error) {
        throw new Error(
          'Error setting priority fees, failed to fetch from RPC',
        );
      }
      return data.result;
    } catch (err) {
      const error = parseError(err, 'Error setting priority fees');
      throw new Error(error.message);
    }
  };
}

function median(values: number[], defaultValue: number) {
  if (values.length === 0) {
    return defaultValue;
  }
  // Sorting values, preventing original array
  // from being mutated.
  values = [...values].sort((a, b) => a - b);

  const half = Math.floor(values.length / 2);

  return Math.floor(
    values.length % 2 ? values[half]! : (values[half - 1]! + values[half]!) / 2,
  );
}
