import { AnchorProvider, BN, Program, web3 } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getTokenPrices } from '../../../common/api/jupiter/utils';
import { ChainId, getChainInfo } from '../../chain';
import { SmartSolanaRpcClient } from '../../svm/transaction/smart-client';
import { getSolanaConnection } from '../../svm/utils';
import { pumpFunIdl } from './idl';
import { Metadata, PumpFunRoute } from './types';

export const pumpFunKeys = {
  PUMP_FUN_PROGRAM_ID: new PublicKey(
    '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  ),
  GLOBAL_ACCOUNT: new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf'),
  FEE_RECIPIENT: new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM'),
  EVENT_AUTHORITY_ACCOUNT: new PublicKey(
    'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1',
  ),
};

export async function getPumpFunMetadata(
  mintAddress: string,
): Promise<Metadata | null> {
  try {
    if (
      !mintAddress ||
      mintAddress === 'So11111111111111111111111111111111111111111' ||
      mintAddress === ''
    ) {
      return null;
    }
    const wsolAddress = getChainInfo(ChainId.Solana).wrappedToken.address;
    const prices = await getTokenPrices([wsolAddress]);
    const solPrice = prices[wsolAddress]!.price;

    const program = getPumpFunProgram();
    const mintPubKey = new PublicKey(mintAddress);
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPubKey.toBuffer()],
      pumpFunKeys.PUMP_FUN_PROGRAM_ID,
    );
    const bondingCurveData = await program.account.bondingCurve!.fetch(
      bondingCurve,
    );
    if (!bondingCurveData) {
      return null;
    }
    if (
      bondingCurveData.complete ||
      bondingCurveData.virtualTokenReserves === 0n
    ) {
      return null;
    }

    // price of 1 token in sol
    // decimals for pump token always 6
    // decimals for sol always 9
    // (lamports / 10e9) / (tokens / 10e6) == lamports / tokens / 10e3
    const priceInSol =
      Number(bondingCurveData.virtualSolReserves) /
      Number(bondingCurveData.virtualTokenReserves) /
      Math.pow(10, 3);

    // price of 1 token in usd
    const priceInUsd = priceInSol * solPrice;

    return {
      bondingCurveAddress: bondingCurve.toString(),
      price: priceInUsd.toString(),
      priceInSol,
    };
  } catch (error) {
    return null;
  }
}

export function calculateAmountToBuy(sol: number, metadata: Metadata) {
  //calculate how many units to buy given an amount of sol in lamports
  const price = metadata.priceInSol;
  if (isNaN(sol) || !price || isNaN(price)) {
    return 0;
  }
  return sol / price;
}

export function calculateAmountToSell(token: number, metadata: Metadata) {
  //calculate sol receieved given an amount of tokens to sell
  const price = metadata.priceInSol;
  if (isNaN(token) || !price || isNaN(price)) {
    return 0;
  }
  return token * price;
}

export function getPumpFunProgram() {
  const connection = getSolanaConnection();
  const dummyWallet = Keypair.generate();
  const provider = new AnchorProvider(
    connection,
    dummyWallet as any,
    AnchorProvider.defaultOptions(),
  );
  return new Program(pumpFunIdl, pumpFunKeys.PUMP_FUN_PROGRAM_ID, provider);
}

function getPumpFunProgramAndKeys(
  mintAddress: string,
  userPublicKey: web3.PublicKey,
  metadata: Metadata,
) {
  const connection = getSolanaConnection();
  const dummyWallet = Keypair.generate();
  const provider = new AnchorProvider(
    connection,
    dummyWallet as any,
    AnchorProvider.defaultOptions(),
  );
  const program = new Program(
    pumpFunIdl,
    pumpFunKeys.PUMP_FUN_PROGRAM_ID,
    provider,
  );

  const mintPublicKey = new PublicKey(mintAddress);
  const bondingCurveAddress = new PublicKey(metadata.bondingCurveAddress);
  const associatedBondingCurveAddress = getAssociatedTokenAddressSync(
    mintPublicKey,
    bondingCurveAddress,
    true,
  );
  const associationUserTokenAddress = getAssociatedTokenAddressSync(
    mintPublicKey,
    userPublicKey,
  );

  return {
    program,
    mintPublicKey,
    bondingCurveAddress,
    associatedBondingCurveAddress,
    associationUserTokenAddress,
  };
}

export async function buyPumpFunToken(
  route: PumpFunRoute,
  userPublicKey: web3.PublicKey,
  computeUnitPrice?: bigint,
) {
  const mintAddress = route.outputMint;
  const sol = parseFloat(route.inAmount) / 10 ** 9;
  const metadata = route.metadata;
  if (!metadata) {
    throw new Error('cannot find metadata');
  }
  const amountToBuyBN = new BN(
    Math.round(calculateAmountToBuy(sol, metadata) * 10 ** 6),
  );
  const slippageMultiplier = 1 + route.slippageBps / 10000;
  const maxSolCostBN = new BN(Math.round(sol * 10 ** 9 * slippageMultiplier));

  const {
    program,
    mintPublicKey,
    bondingCurveAddress,
    associatedBondingCurveAddress,
    associationUserTokenAddress,
  } = getPumpFunProgramAndKeys(mintAddress, userPublicKey, metadata);

  const instruction = await program.methods.buy!(amountToBuyBN, maxSolCostBN)
    .accounts({
      global: pumpFunKeys.GLOBAL_ACCOUNT,
      feeRecipient: pumpFunKeys.FEE_RECIPIENT,
      mint: mintPublicKey,
      bondingCurve: bondingCurveAddress,
      associatedBondingCurve: associatedBondingCurveAddress,
      associatedUser: associationUserTokenAddress,
      user: userPublicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
      eventAuthority: pumpFunKeys.EVENT_AUTHORITY_ACCOUNT,
      program: pumpFunKeys.PUMP_FUN_PROGRAM_ID,
    })
    .instruction();
  const createToTokenAccountIx =
    createAssociatedTokenAccountIdempotentInstruction(
      userPublicKey,
      associationUserTokenAddress,
      userPublicKey,
      mintPublicKey,
    );
  const rpcClient = new SmartSolanaRpcClient();
  return rpcClient.buildSmartTransaction(
    [createToTokenAccountIx, instruction],
    userPublicKey,
    undefined,
    [pumpFunKeys.PUMP_FUN_PROGRAM_ID.toBase58()],
    undefined,
    undefined,
    computeUnitPrice,
  );
}

export async function sellPumpFunToken(
  route: PumpFunRoute,
  userPublicKey: web3.PublicKey,
  computeUnitPrice?: bigint,
) {
  const mintAddress = route.inputMint;
  const tokensToSell = Math.round(parseFloat(route.inAmount));
  const metadata = route.metadata;
  if (!metadata) {
    throw new Error('cannot find metadata');
  }

  const {
    program,
    mintPublicKey,
    bondingCurveAddress,
    associatedBondingCurveAddress,
    associationUserTokenAddress,
  } = getPumpFunProgramAndKeys(mintAddress, userPublicKey, metadata);

  const amountBN = new BN(tokensToSell);

  const outputSol = parseInt(route.outAmount);
  const slippageMultiplier = 1 - route.slippageBps / 10000;
  const minSolOutputBN = new BN(Math.round(outputSol * slippageMultiplier));

  const instruction = await program.methods.sell!(amountBN, minSolOutputBN)
    .accounts({
      global: pumpFunKeys.GLOBAL_ACCOUNT,
      feeRecipient: pumpFunKeys.FEE_RECIPIENT,
      mint: mintPublicKey,
      bondingCurve: bondingCurveAddress,
      associatedBondingCurve: associatedBondingCurveAddress,
      associatedUser: associationUserTokenAddress,
      user: userPublicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
      eventAuthority: pumpFunKeys.EVENT_AUTHORITY_ACCOUNT,
      program: pumpFunKeys.PUMP_FUN_PROGRAM_ID,
    })
    .instruction();
  const rpcClient = new SmartSolanaRpcClient();
  return rpcClient.buildSmartTransaction(
    [instruction],
    userPublicKey,
    undefined,
    [pumpFunKeys.PUMP_FUN_PROGRAM_ID.toBase58()],
    undefined,
    undefined,
    computeUnitPrice,
  );
}
