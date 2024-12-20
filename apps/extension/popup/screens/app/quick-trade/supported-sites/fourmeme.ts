import { ChainId } from '@nestwallet/app/features/chain';
import { fetchDecimals } from '@nestwallet/app/features/crypto/balance';
import { getFourMemeTokenMetadata } from '@nestwallet/app/features/swap/fourmeme/utils';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';

export async function getFourMemeToken(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  if (!url) {
    return;
  }
  const prefix = 'https://four.meme/token/';
  if (!url.startsWith(prefix)) {
    return;
  }
  const address = url.slice(prefix.length);
  const metadata = await getFourMemeTokenMetadata(address);
  if (!metadata) {
    return;
  }
  return {
    symbol: metadata.shortName,
    name: metadata.name,
    logo: metadata.image || undefined,
    chainId: ChainId.BinanceSmartChain,
    address: address,
    decimals: await fetchDecimals(ChainId.BinanceSmartChain, address),
  };
}
