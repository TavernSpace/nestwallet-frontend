import { useLoadFunction } from '@nestwallet/app/common/hooks/loading';
import { Preferences } from '@nestwallet/app/common/types';
import { QueryOptions } from '@nestwallet/app/common/utils/query';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAppContext } from '../provider/application';
import { useUserContext } from '../provider/user';

export function useWalletById(walletId?: string) {
  const { accounts } = useUserContext();
  const wallets = accounts.flatMap((accounts) => accounts.organization.wallets);
  const wallet = wallets.find((wallet) => wallet.id === walletId);
  return { wallet };
}

export function usePreferencesQuery(options?: QueryOptions) {
  const { userService } = useAppContext();
  return useQuery<Preferences>({
    queryKey: ['queryPreferences'],
    queryFn: () => userService.getPreferences(),
    ...options,
  });
}

export function usePreferences() {
  const { userService } = useAppContext();
  const preferences = useCallback(() => userService.getPreferences(), []);
  return useLoadFunction(preferences);
}

export function useTradeSettings() {
  const { userService } = useAppContext();
  const data = useCallback(() => userService.getTradeSettings(), []);
  return useLoadFunction(data);
}

export function useTokenDetailSettings() {
  const { userService } = useAppContext();
  const data = useCallback(() => userService.getTokenDetailSettings(), []);
  return useLoadFunction(data);
}
