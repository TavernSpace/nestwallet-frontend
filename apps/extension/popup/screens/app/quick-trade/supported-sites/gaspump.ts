import { ChainId } from '@nestwallet/app/features/chain';
import { fetchDecimals } from '@nestwallet/app/features/crypto/balance';
import { getGasPumpMetadata } from '@nestwallet/app/features/swap/gaspump/gaspump';
import { isTONAddress } from '@nestwallet/app/features/tvm/utils';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';

export async function getGasPumpToken(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  if (!url) {
    return;
  }
  const prefix = 'https://gaspump.tg/#/token/trade?token_address=';
  if (!url.startsWith(prefix)) {
    return;
  }
  const address = url.slice(prefix.length);
  if (!isTONAddress(address)) {
    return;
  }
  const metadata = await getGasPumpMetadata(address);
  if (!metadata) {
    return;
  }

  return {
    symbol: metadata.ticker,
    name: metadata.name,
    logo: metadata.image_url,
    chainId: ChainId.Ton,
    address: metadata.token_address,
    decimals: await fetchDecimals(ChainId.Ton, metadata.token_address),
  };
}
