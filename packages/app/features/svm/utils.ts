import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { ChainId, getChainInfo } from '../chain';

export function getSolanaRpcUrl() {
  const solana = getChainInfo(ChainId.Solana);
  return solana.rpcUrls.default.http[0]!;
}

export function getJitoBundleUrl() {
  return `https://mainnet.block-engine.jito.wtf/api/v1/bundles`;
}

export function getJitoRpcUrl(bundle: boolean) {
  return `https://mainnet.block-engine.jito.wtf/api/v1/transactions${
    bundle ? '?bundleOnly=true' : ''
  }`;
}

export function getSolanaConnection(mev = false, bundleOnly = true) {
  return new Connection(
    !mev ? getSolanaRpcUrl() : getJitoRpcUrl(bundleOnly),
    'confirmed',
  );
}

export function isVersionedTransaction(
  transaction: Transaction | VersionedTransaction,
): transaction is VersionedTransaction {
  return 'version' in transaction;
}

export function isSolanaAddress(address: string) {
  try {
    const pk = new PublicKey(address);
    return PublicKey.isOnCurve(pk.toBytes());
  } catch {
    return false;
  }
}

export function isSolanaTokenAddress(address: string) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function deriveTokenAccountAddress(
  walletAddress: string,
  mintAddress: string,
): PublicKey {
  const userPubKey = new PublicKey(walletAddress);
  const mintPubKey = new PublicKey(mintAddress);

  const [associatedTokenAddress] = PublicKey.findProgramAddressSync(
    [userPubKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubKey.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return associatedTokenAddress;
}
