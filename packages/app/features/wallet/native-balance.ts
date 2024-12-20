import { useQueries } from '@tanstack/react-query';
import { ISignerWallet, IWalletWithLoadableBalance } from '../../common/types';
import { QueryOptions, loadDataFromQuery } from '../../common/utils/query';
import { ChainId } from '../chain';
import { getJSONRPCProvider } from '../evm/provider';

export function useNativeBalancesWithWalletsQuery(
  chainId: ChainId,
  wallets: ISignerWallet[],
  options?: QueryOptions,
): IWalletWithLoadableBalance[] {
  const provider = getJSONRPCProvider(chainId);
  const balancesQuery = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: ['eth_getBalance_query', wallet.address, chainId],
      queryFn: async () => {
        const balance = await provider.getBalance(wallet.address);
        return balance.toString();
      },
      options,
    })),
  });
  return wallets.map((_, index) => ({
    wallet: wallets[index]!,
    balance: loadDataFromQuery(balancesQuery[index]!),
  }));
}
