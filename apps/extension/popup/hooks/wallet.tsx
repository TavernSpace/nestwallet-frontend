import { useUserContext } from '../provider/user';

export function useWalletById(walletId?: string) {
  const { wallets } = useUserContext();
  const wallet = wallets.find((wallet) => wallet.id === walletId);
  return { wallet };
}
