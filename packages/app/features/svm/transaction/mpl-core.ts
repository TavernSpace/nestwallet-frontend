// CODE COPIED FROM
// https://github.com/metaplex-foundation/mpl-core/blob/main/clients/js/src/generated/instructions/transferV1.ts
// USED TO CREATE TRANSFER INSTRUCTION ASSUMING NO COMPRESSION PROOF
import {
  AccountMeta,
  Option,
  OptionOrNullable,
  Pda,
  PublicKey,
  Signer,
  isSigner,
  none,
  publicKey,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  mapSerializer,
  option,
  publicKey as publicKeySerializer,
  string,
  struct,
  u64,
  u8,
} from '@metaplex-foundation/umi-serializers';
import * as web3 from '@solana/web3.js';

// T
export type CompressionProof = {
  owner: PublicKey;
  name: string;
  uri: string;
  seq: bigint;
};

export type CompressionProofArgs = {
  owner: PublicKey;
  name: string;
  uri: string;
  seq: number | bigint;
};

export function getCompressionProofSerializer(): Serializer<
  CompressionProofArgs,
  CompressionProof
> {
  return struct<CompressionProof>(
    [
      ['owner', publicKeySerializer()],
      ['name', string()],
      ['uri', string()],
      ['seq', u64()],
    ],
    { description: 'CompressionProof' },
  ) as Serializer<CompressionProofArgs, CompressionProof>;
}

/**
 * Defines an instruction account to resolve.
 * @internal
 */
export type ResolvedAccount<T = PublicKey | Pda | Signer | null> = {
  isWritable: boolean;
  value: T;
};

/**
 * Defines a set of instruction account to resolve.
 * @internal
 */
export type ResolvedAccounts = Record<string, ResolvedAccount>;

/**
 * Defines a set of instruction account to resolve with their indices.
 * @internal
 */
export type ResolvedAccountsWithIndices = Record<
  string,
  ResolvedAccount & { index: number }
>;

/**
 * Get account metas and signers from resolved accounts.
 * @internal
 */
export function getAccountMetasAndSigners(
  accounts: ResolvedAccount[],
  optionalAccountStrategy: 'omitted' | 'programId',
  programId: PublicKey,
): [AccountMeta[], Signer[]] {
  const keys: AccountMeta[] = [];
  const signers: Signer[] = [];

  accounts.forEach((account) => {
    if (!account.value) {
      if (optionalAccountStrategy === 'omitted') return;
      keys.push({ pubkey: programId, isSigner: false, isWritable: false });
      return;
    }

    if (isSigner(account.value)) {
      signers.push(account.value);
    }
    keys.push({
      pubkey: publicKey(account.value, false),
      isSigner: isSigner(account.value),
      isWritable: account.isWritable,
    });
  });

  return [keys, signers];
}

// Accounts.
export type TransferV1InstructionAccounts = {
  /** The address of the asset */
  asset: web3.PublicKey;
  /** The collection to which the asset belongs */
  collection: web3.PublicKey;
  /** The account paying for the storage fees */
  payer: web3.PublicKey;
  /** The owner or delegate of the asset */
  authority: web3.PublicKey;
  /** The new owner to which to transfer the asset */
  newOwner: web3.PublicKey;
  /** The system program */
  systemProgram: web3.PublicKey;
  /** The SPL Noop Program */
  logWrapper: web3.PublicKey;
};

// Data.
export type TransferV1InstructionData = {
  discriminator: number;
  compressionProof: Option<CompressionProof>;
};

export type TransferV1InstructionDataArgs = {
  compressionProof?: OptionOrNullable<CompressionProofArgs>;
};

export function getTransferV1InstructionDataSerializer(): Serializer<
  TransferV1InstructionDataArgs,
  TransferV1InstructionData
> {
  return mapSerializer<
    TransferV1InstructionDataArgs,
    any,
    TransferV1InstructionData
  >(
    struct<TransferV1InstructionData>(
      [
        ['discriminator', u8()],
        ['compressionProof', option(getCompressionProofSerializer())],
      ],
      { description: 'TransferV1InstructionData' },
    ),
    (value) => ({
      ...value,
      discriminator: 14,
      compressionProof: none(),
    }),
  ) as Serializer<TransferV1InstructionDataArgs, TransferV1InstructionData>;
}

// Args.
export type TransferV1InstructionArgs = TransferV1InstructionDataArgs;

// Instruction.
export function mplCoreTransferV1(
  input: TransferV1InstructionAccounts & TransferV1InstructionArgs,
): web3.TransactionInstruction {
  // Program ID.
  const programId = new web3.PublicKey(
    'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d',
  );

  // Accounts
  const keys: web3.AccountMeta[] = [
    {
      pubkey: input.asset,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: input.collection,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: input.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: input.authority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: input.newOwner,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: input.systemProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: input.logWrapper,
      isWritable: false,
      isSigner: false,
    },
  ];

  // Arguments.
  const resolvedArgs: TransferV1InstructionArgs = { ...input };

  // Data.
  const data = getTransferV1InstructionDataSerializer().serialize(
    resolvedArgs as TransferV1InstructionDataArgs,
  );

  const bufferData = Buffer.from(data);

  return new web3.TransactionInstruction({
    programId,
    keys,
    data: bufferData,
  });
}
