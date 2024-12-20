import { getAddress } from 'ethers';
import { ChainId } from '../../../features/chain';
import { fetchDecimals } from '../../../features/crypto/balance';
import { isEVMAddress } from '../../../features/evm/utils';
import { BasicTokenInfo } from '../../../screens/quick-trade/types';
import { DexScreenerPairsResponse } from './types';

const dexScreenerChainMap: Record<string, number> = {
  bsc: ChainId.BinanceSmartChain,
  arbitrum: ChainId.Arbitrum,
  optimism: ChainId.Optimism,
  gnosischain: ChainId.Gnosis,
  polygon: ChainId.Polygon,
  ethereum: ChainId.Ethereum,
  avalanche: ChainId.Avalanche,
  base: ChainId.Base,
  blast: ChainId.Blast,
  scroll: ChainId.Scroll,
  linea: ChainId.Linea,
  zksync: ChainId.ZkSync,
  solana: ChainId.Solana,
  ton: ChainId.Ton,
};

export const dexScreenerInverseChainMap: Record<number, string> = {
  [ChainId.BinanceSmartChain]: 'bsc',
  [ChainId.Arbitrum]: 'arbitrum',
  [ChainId.Optimism]: 'optimism',
  [ChainId.Gnosis]: 'gnosischain',
  [ChainId.Polygon]: 'polygon',
  [ChainId.Ethereum]: 'ethereum',
  [ChainId.Avalanche]: 'avalanche',
  [ChainId.Base]: 'base',
  [ChainId.Blast]: 'blast',
  [ChainId.Scroll]: 'scroll',
  [ChainId.Linea]: 'linea',
  [ChainId.ZkSync]: 'zksync',
  [ChainId.Solana]: 'solana',
  [ChainId.Ton]: 'ton',
};

// TODO: add solana support
export async function parseDexScreenerTokenUrl(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  const prefix = 'https://dexscreener.com';
  if (!url) {
    return;
  }
  const isDexScreener = url.startsWith(prefix);
  if (!isDexScreener) {
    return;
  }
  const [base] = url.split('?');
  const [chain, pool] = base!.slice(prefix.length + 1).split('/');

  const dexChain = chain ? dexScreenerChainToChainId(chain) : null;
  const dexPoolOrToken = !pool
    ? null
    : pool && isEVMAddress(pool)
    ? getAddress(pool)
    : pool;

  if (!dexChain || !dexPoolOrToken) {
    return;
  } else {
    const pair = await getDexScreenerPair(dexChain, dexPoolOrToken);
    if (!pair) {
      return;
    }
    const decimals = await fetchDecimals(dexChain, pair.baseToken.address);
    const token: BasicTokenInfo = {
      address: pair.baseToken.address,
      chainId: dexChain,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: pair.priceUsd,
      logo: pair.info?.imageUrl,
      decimals,
    };
    return token;
  }
}

function dexScreenerChainToChainId(chain: string) {
  return dexScreenerChainMap[chain];
}

export async function getDexScreenerPair(chainId: number, pool: string) {
  const chain = dexScreenerInverseChainMap[chainId];
  if (!chain) {
    throw new Error('Unsupported chainId provided');
  }
  const apiUrl = `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pool}`;
  const response = await fetch(apiUrl, { cache: 'force-cache' });
  const data: DexScreenerPairsResponse = await response.json();
  if (data.pairs && data.pairs.length > 0) {
    return data.pairs[0];
  } else {
    const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${pool}`;
    const response = await fetch(tokenUrl, { cache: 'force-cache' });
    const data: DexScreenerPairsResponse = await response.json();
    return data.pairs?.[0];
  }
}

export async function getDexScreenerToken(chainId: number, token: string) {
  const chain = dexScreenerInverseChainMap[chainId];
  if (!chain) {
    throw new Error('Unsupported chainId provided');
  }
  const tokenUrl = `https://api.dexscreener.com/latest/dex/tokens/${token}`;
  const response = await fetch(tokenUrl);
  const data: DexScreenerPairsResponse = await response.json();
  return data.pairs?.[0];
}
