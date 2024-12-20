import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import { SmartSolanaRpcClient } from '../../svm/transaction/smart-client';
import { getSolanaConnection, getSolanaRpcUrl } from '../../svm/utils';
import { moonshotIdl } from './idl';
import { MoonshotRoute, MoonshotTokenMetadata } from './types';

export const moonshotKeys = {
  MOONSHOT_PROGRAM_ID: new PublicKey(
    'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
  ),
  DEX_FEE: new PublicKey('3udvfL24waJcLhskRAsStNMoNUvtyXdxrWQz4hgi953N'),
  HELIO_FEE: new PublicKey('5K5RtTWzzLp4P8Npi84ocf7F1vBsAu29N1irG4iiUnzt'),
};

export function calculateAmountToBuy(
  token: MoonshotTokenMetadata,
  sol: number,
) {
  const price = parseFloat(token.priceNative); //price in sol
  if (isNaN(sol) || !price || isNaN(price) || price === 0) {
    return 0;
  }
  const amount = sol / price;
  return amount;
}

export function calculateAmountToSell(
  token: MoonshotTokenMetadata,
  tokensToSell: number,
) {
  const price = parseFloat(token.priceNative); //price in sol
  if (isNaN(tokensToSell) || !price || isNaN(price)) {
    return 0;
  }
  const amount = tokensToSell * price;
  return amount;
}

export async function buyOrSellMoonshotToken(
  route: MoonshotRoute,
  userPublicKey: PublicKey,
  computeUnitPrice?: bigint,
) {
  const moonshot = new Moonshot({
    rpcUrl: getSolanaRpcUrl(),
    environment: Environment.MAINNET,
  });

  const moonshotToken = moonshot.Token({
    mintAddress: route.tokenMetadata.baseToken.address,
  });

  const { ixs } = await moonshotToken.prepareIxs({
    slippageBps: route.slippageBps,
    creatorPK: userPublicKey.toBase58(),
    tokenAmount: route.txType === 'buy' ? route.outAmount : route.inAmount,
    collateralAmount: route.txType === 'buy' ? route.inAmount : route.outAmount,
    tradeDirection: route.txType === 'buy' ? 'BUY' : 'SELL',
    fixedSide: FixedSide.IN,
  });

  const rpcClient = new SmartSolanaRpcClient();
  return rpcClient.buildSmartTransaction(
    ixs,
    userPublicKey,
    undefined,
    [moonshotKeys.MOONSHOT_PROGRAM_ID.toBase58()],
    undefined,
    undefined,
    computeUnitPrice,
  );
}

export function getMoonshotProgram() {
  const connection = getSolanaConnection();
  const dummyWallet = Keypair.generate();
  const provider = new AnchorProvider(
    connection,
    dummyWallet as any,
    AnchorProvider.defaultOptions(),
  );
  return new Program(moonshotIdl, moonshotKeys.MOONSHOT_PROGRAM_ID, provider);
}
