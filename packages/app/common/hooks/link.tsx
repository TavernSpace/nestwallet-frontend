import { Linking } from 'react-native';
import { ChainId, getChainInfo } from '../../features/chain';
import { Nullable } from '../types';

interface BlockchainExplorerData {
  type: 'tx' | 'address' | 'token';
  data: Nullable<string>;
}

export function useLinkToBlockchainExplorer(
  chainId: number,
  data: BlockchainExplorerData,
) {
  return {
    explore: () => linkToBlockchainExplorer(chainId, data),
  };
}

export function linkToBlockchainExplorer(
  chainId: number,
  data: BlockchainExplorerData,
) {
  const chainInfo = getChainInfo(chainId);
  const blockExplorerURL = chainInfo.blockExplorers?.default.url;
  if (chainInfo.id === ChainId.Ton && blockExplorerURL && data.data) {
    const prefix = data.type === 'tx' ? 'transaction/' : '';
    Linking.openURL(`${blockExplorerURL}/${prefix}${data.data}`);
  } else if (blockExplorerURL && data.data) {
    Linking.openURL(`${blockExplorerURL}/${data.type}/${data.data}`);
  }
}

export function linkToSolanaFM(address: string) {
  const solanaFmURL = 'https://solana.fm/address';
  Linking.openURL(`${solanaFmURL}/${address}`);
}
