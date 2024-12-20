import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { ethers } from 'ethers';
import { AssetTransfer } from '../../../common/types';
import { isCryptoBalance } from '../../../common/utils/types';
import {
  ICryptoBalance,
  INftBalance,
  ITokenMetadata,
  ITokenType,
} from '../../../graphql/client/generated/graphql';
import { getSolanaConnection } from '../utils';
import { mplCoreTransferV1 } from './mpl-core';
import { SmartSolanaRpcClient } from './smart-client';
import { CompressedNftTreeData, CompressionData, OwnershipData } from './types';
import { createBubblegumTransferInstruction } from './utils';

async function getSolTransferInstructions(
  from: string,
  to: string,
  asset: ITokenMetadata,
  amount: string,
  sendWrapped: boolean = false,
): Promise<TransactionInstruction[]> {
  const tokenAmount = ethers.parseUnits(amount, asset.decimals);
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);
  if (!sendWrapped) {
    return [
      SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: tokenAmount,
      }),
    ];
  } else {
    const toWsolATA = getAssociatedTokenAddressSync(
      NATIVE_MINT,
      toPubkey,
      false,
      TOKEN_PROGRAM_ID,
    );
    const createWsolATAIx = createAssociatedTokenAccountIdempotentInstruction(
      fromPubkey,
      toWsolATA,
      toPubkey,
      NATIVE_MINT,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const transferIx = SystemProgram.transfer({
      fromPubkey,
      toPubkey: toWsolATA,
      lamports: BigInt(ethers.parseUnits(amount, 9)),
    });
    const syncNativeIx = createSyncNativeInstruction(
      toWsolATA,
      TOKEN_PROGRAM_ID,
    );

    return [createWsolATAIx, transferIx, syncNativeIx];
  }
}

async function getTokenTransferInstructions(
  from: string,
  to: string,
  asset: ICryptoBalance | INftBalance,
  amount: string,
): Promise<TransactionInstruction[]> {
  const tokenAmount = isCryptoBalance(asset)
    ? ethers.parseUnits(amount, asset.tokenMetadata.decimals)
    : 1;
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);
  const mintPubkey = new PublicKey(asset.address);
  const connection = getSolanaConnection();
  const tokenProgram = await connection
    .getAccountInfo(mintPubkey)
    .then((accountInfo) => accountInfo!.owner);
  const fromTokenAccount = getAssociatedTokenAddressSync(
    mintPubkey,
    fromPubkey,
    false,
    tokenProgram,
  );
  const toTokenAccount = getAssociatedTokenAddressSync(
    mintPubkey,
    toPubkey,
    false,
    tokenProgram,
  );

  const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);

  const instructions = [];
  if (toTokenAccountInfo === null) {
    const createToTokenAccountIx = createAssociatedTokenAccountInstruction(
      fromPubkey,
      toTokenAccount,
      toPubkey,
      mintPubkey,
      tokenProgram,
    );
    instructions.push(createToTokenAccountIx);
  }

  const transferInstruction = createTransferCheckedInstruction(
    fromTokenAccount,
    mintPubkey,
    toTokenAccount,
    fromPubkey,
    tokenAmount,
    isCryptoBalance(asset) ? asset.tokenMetadata.decimals : 0,
    undefined,
    tokenProgram,
  );
  instructions.push(transferInstruction);
  return instructions;
}

async function getMplCoreAssetTransferInstructions(
  from: string,
  to: string,
  asset: INftBalance,
): Promise<TransactionInstruction[]> {
  const MPL_CORE_PROGRAM = new PublicKey(
    'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d',
  );
  const fromPubkey = new PublicKey(from);
  const toPubkey = new PublicKey(to);
  const assetPubkey = new PublicKey(asset.address);
  const collectionPubkey = new PublicKey(asset.collectionMetadata.address);
  const transferIx = mplCoreTransferV1({
    asset: assetPubkey,
    collection: collectionPubkey,
    payer: fromPubkey,
    authority: fromPubkey,
    newOwner: toPubkey,
    systemProgram: MPL_CORE_PROGRAM,
    logWrapper: MPL_CORE_PROGRAM,
  });
  return [transferIx];
}

async function getCompressedNftTransferInstructions(
  from: string,
  to: string,
  asset: INftBalance,
): Promise<TransactionInstruction[]> {
  const connection = getSolanaConnection();
  const [assetResponse, assetProofResponse] = await Promise.all([
    fetch('https://aura-mainnet.metaplex.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '0',
        method: 'getAsset',
        params: [asset.address],
      }),
    }),
    fetch('https://aura-mainnet.metaplex.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '0',
        method: 'getAssetProof',
        params: [asset.address],
      }),
    }),
  ]);

  if (!assetResponse.ok || !assetProofResponse.ok) {
    throw new Error('Asset not found');
  }

  const [assetReponseJson, assetProofResponseJson] = await Promise.all([
    assetResponse.json(),
    assetProofResponse.json(),
  ]);

  if (!assetReponseJson.result || !assetProofResponseJson.result) {
    throw new Error('Invalid compressed NFT data');
  }

  const compressionData = assetReponseJson.result
    .compression as CompressionData;
  const ownershipData = assetReponseJson.result.ownership as OwnershipData;
  const merkleTreeData = assetProofResponseJson.result as CompressedNftTreeData;

  if (!compressionData || !ownershipData || !merkleTreeData) {
    throw new Error('Invalid compressed NFT data');
  }

  const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connection,
    new PublicKey(merkleTreeData.tree_id),
  );

  const canopyDepth = treeAccount.getCanopyDepth();
  const assetProof = merkleTreeData.proof;

  const proof: AccountMeta[] = assetProof
    .slice(0, assetProof.length - (canopyDepth ? canopyDepth : 0))
    .map((node: string) => ({
      pubkey: new PublicKey(node),
      isSigner: false,
      isWritable: false,
    }));

  const treeAuthority = treeAccount.getAuthority();
  const leafOwner = new PublicKey(from);
  const newLeafOwner = new PublicKey(to);
  const delegate = ownershipData.delegate
    ? new PublicKey(ownershipData.delegate)
    : leafOwner;

  const ix = createBubblegumTransferInstruction(
    {
      treeAuthority: treeAuthority,
      leafOwner: leafOwner,
      leafDelegate: delegate,
      newLeafOwner: newLeafOwner,
      merkleTree: new PublicKey(merkleTreeData.tree_id),
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      anchorRemainingAccounts: proof,
    },
    {
      root: [...new PublicKey(merkleTreeData.root.trim()).toBytes()],
      dataHash: [...new PublicKey(compressionData.data_hash.trim()).toBytes()],
      creatorHash: [
        ...new PublicKey(compressionData.creator_hash.trim()).toBytes(),
      ],
      nonce: compressionData.leaf_id,
      index: compressionData.leaf_id,
    },
  );
  return [ix];
}

export async function getTransferTransactionData(
  from: string,
  transfers: AssetTransfer[],
  computeUnitPrice?: bigint,
): Promise<string> {
  if (transfers.length === 0) {
    throw new Error('Invalid Solana transaction');
  }
  const rpcClient = new SmartSolanaRpcClient();
  const instructions: TransactionInstruction[] = [];
  for (const value of transfers) {
    if (!isCryptoBalance(value.asset)) {
      if (value.asset.collectionMetadata.tokenType == ITokenType.Mplcore) {
        const ix = await getMplCoreAssetTransferInstructions(
          from,
          value.recipient,
          value.asset,
        );
        instructions.push(...ix);
      } else if (
        value.asset.collectionMetadata.tokenType == ITokenType.Bubblegum
      ) {
        const ix = await getCompressedNftTransferInstructions(
          from,
          value.recipient,
          value.asset,
        );
        instructions.push(...ix);
      } else {
        // spl token
        const ix = await getTokenTransferInstructions(
          from,
          value.recipient,
          value.asset,
          value.value,
        );
        instructions.push(...ix);
      }
    } else {
      const isToken = !value.asset.tokenMetadata.isNativeToken;
      const ix = isToken
        ? await getTokenTransferInstructions(
            from,
            value.recipient,
            value.asset,
            value.value,
          )
        : await getSolTransferInstructions(
            from,
            value.recipient,
            value.asset.tokenMetadata,
            value.value,
            value.wrapSol ?? false,
          );
      instructions.push(...ix);
    }
  }
  return rpcClient.buildSmartTransaction(
    instructions,
    new PublicKey(from),
    undefined,
    undefined,
    1_000_000,
    95,
    computeUnitPrice,
  );
}
