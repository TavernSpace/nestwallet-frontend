import { ChainId } from '@nestwallet/app/features/chain';
import { svmTokenMetadata } from '@nestwallet/app/features/crypto/metadata';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';

export async function getPumpFunToken(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  if (!url) {
    return;
  }
  const prefix = 'https://pump.fun/';
  if (!url.startsWith(prefix)) {
    return;
  }
  const address = url.slice(prefix.length);
  const addressLength = address.length;
  if (addressLength < 32 || addressLength > 44) {
    return;
  }
  if (address.includes('/')) {
    return;
  }
  const metadata = await svmTokenMetadata(address);
  if (!metadata) {
    return;
  }
  return {
    symbol: metadata.symbol,
    name: metadata.name,
    logo: metadata.imageUrl || undefined,
    chainId: ChainId.Solana,
    address: address,
    decimals: metadata.decimals,
  };
}
