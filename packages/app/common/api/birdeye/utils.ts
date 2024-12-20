import { ChainId } from '../../../features/chain';

export const birdEyeChainMap: Record<string, number> = {
  bsc: ChainId.BinanceSmartChain,
  arbitrum: ChainId.Arbitrum,
  optimism: ChainId.Optimism,
  // gnosischain: ChainId.Gnosis,
  polygon: ChainId.Polygon,
  ethereum: ChainId.Ethereum,
  avalanche: ChainId.Avalanche,
  base: ChainId.Base,
  // blast: ChainId.Blast,
  // scroll: ChainId.Scroll,
  solana: ChainId.Solana,
  zksync: ChainId.ZkSync,
};

export const birdEyeInverseChainMap: Record<number, string> = {
  [ChainId.BinanceSmartChain]: 'bsc',
  [ChainId.Arbitrum]: 'arbitrum',
  [ChainId.Optimism]: 'optimism',
  // [ChainId.Gnosis]: 'gnosischain',
  [ChainId.Polygon]: 'polygon',
  [ChainId.Ethereum]: 'ethereum',
  [ChainId.Avalanche]: 'avalanche',
  [ChainId.Base]: 'base',
  // [ChainId.Blast]: 'blast',
  // [ChainId.Scroll]: 'scroll',
  [ChainId.Solana]: 'solana',
  [ChainId.ZkSync]: 'zksync',
};
