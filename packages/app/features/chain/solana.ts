import { Chain, defineChain } from 'viem';
import { solanaRpcUrl } from '../../common/api/nestwallet/utils';

export const solana: Chain = defineChain({
  id: 1399811149,
  name: 'Solana',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  rpcUrls: {
    default: {
      http: [solanaRpcUrl],
    },
  },
  blockExplorers: {
    default: { name: 'Solscan', url: 'https://solscan.io' },
  },
});
