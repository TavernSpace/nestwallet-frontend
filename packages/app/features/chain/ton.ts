import { Chain, defineChain } from 'viem';

export const ton: Chain = defineChain({
  id: 607,
  name: 'Ton',
  nativeCurrency: { name: 'Ton', symbol: 'TON', decimals: 9 },
  rpcUrls: {
    default: {
      http: ['https://toncenter.com/api/v2/jsonRPC'],
    },
  },
  blockExplorers: {
    default: { name: 'Tonscan', url: 'https://tonscan.org/' },
  },
});
