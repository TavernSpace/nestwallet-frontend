import { recordify } from '../../common/utils/functions';
import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { ChainId, ChainInfo, chains } from './chain';

export * from './chain';

const chainMap = recordify(chains, (chain) => chain.id);

const supportedChains: ChainInfo[] =
  process.env.NODE_ENV !== 'production' ? chains : chains;

export const safeSupportedChains: ChainInfo[] = supportedChains.filter(
  (chain) => isSafeSupportedChain(chain.id),
);

export const supportedChainsForBlockchain = {
  [IBlockchainType.Evm]: supportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Evm,
  ),
  [IBlockchainType.Svm]: supportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Svm,
  ),
  [IBlockchainType.Tvm]: supportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Tvm,
  ),
};

const swapSupportedChains: ChainInfo[] = supportedChains
  .filter((chain) => isSwapSupportedChain(chain.id))
  .sort((c1, c2) => c2.swapPriority - c1.swapPriority);

export const swapSupportedChainsForBlockchain = {
  [IBlockchainType.Evm]: swapSupportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Evm,
  ),
  [IBlockchainType.Svm]: swapSupportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Svm,
  ),
  [IBlockchainType.Tvm]: swapSupportedChains.filter(
    (chain) => chain.blockchain === IBlockchainType.Tvm,
  ),
};

export function getChainInfo(chainId: number): ChainInfo {
  const chain = chainMap[chainId];
  if (!chain) {
    throw new Error(`unsupported chainId=${chainId}`);
  }
  return chain;
}

export function isSupportedChain(chainId: number) {
  const chain = chainMap[chainId];
  return chain ? chain.flags.isSupported : false;
}

export function isSafeSupportedChain(chainId: number) {
  const chain = chainMap[chainId];
  return chain ? chain.flags.isSafeSupported : false;
}

export function isBlowfishSupportedChain(chainId: number) {
  const chain = chainMap[chainId];
  return chain ? chain.flags.isBlowfishSupported : false;
}

export function isSwapSupportedChain(chainId: number) {
  const chain = chainMap[chainId];
  return chain ? chain.flags.isSwapSupported : false;
}

export function getChainIdWithDefault(
  chainId?: number,
  defaultChain = ChainId.Ethereum,
): ChainId {
  return chainId || defaultChain;
}

export const onBlockchain =
  (blockchain: IBlockchainType) =>
  <TReturnE, TReturnS, TReturnT>(
    onEvm: () => TReturnE,
    onSvm: () => TReturnS,
    onTvm: () => TReturnT,
  ) =>
    blockchain === IBlockchainType.Evm
      ? onEvm()
      : blockchain === IBlockchainType.Svm
      ? onSvm()
      : onTvm();
