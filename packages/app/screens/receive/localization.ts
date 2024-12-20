import { ChainInfo } from '../../features/chain';

export const localization = {
  copiedAddress: {
    en: 'Copied address!',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  safeText: (network: string) => ({
    en: `This is a Safe deployed on the ${network} network. Any assets sent to this address on any other network may be permanently lost.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  evmText: (validChains: ChainInfo[]) => ({
    en: `Receive tokens on any of the ${
      validChains.length
    }+ Ethereum-compatible networks supported by Nest Wallet. You will be able to see your balances on ${validChains
      .slice(0, -1)
      .map((chain) => chain.name)
      .join(', ')}, and ${validChains[validChains.length - 1]!.name}.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  svmText: {
    en: 'Receive tokens on Solana. Do not send any assets from Ethereum or TON to this address or they will be permanently lost.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  tvmText: {
    en: 'Receive tokens on TON. Do not send any assets from Ethereum or Solana to this address or they will be permanently lost.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
};
