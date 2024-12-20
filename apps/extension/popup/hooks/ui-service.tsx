import { useLoadFunction } from '@nestwallet/app/common/hooks/loading';
import { QueryOptions } from '@nestwallet/app/common/utils/query';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAppContext } from '../provider/application';

export function connectedSiteQueryKey() {
  return ['queryConnectSite'];
}

export function connectedSitesQueryKey() {
  return ['queryConnectSites'];
}

export function useConnectedSitesQuery(options?: QueryOptions) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryConnectSites'],
    queryFn: () => walletService.getConnectedSites(),
    ...options,
  });
}

export function useConnectedSiteQuery(options?: QueryOptions) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: connectedSiteQueryKey(),
    queryFn: () => walletService.getConnectedSite(),
    ...options,
  });
}

export function usePreferencesQuery(options?: QueryOptions) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryPreferences'],
    queryFn: () => walletService.getPreferences(),
    ...options,
  });
}

export function usePreferences() {
  const { walletService } = useAppContext();
  const preferences = useCallback(() => walletService.getPreferences(), []);
  return useLoadFunction(preferences);
}

export function useTradeSettings() {
  const { walletService } = useAppContext();
  const data = useCallback(() => walletService.getTradeSettings(), []);
  return useLoadFunction(data);
}

export function useTokenDetailSettings() {
  const { walletService } = useAppContext();
  const data = useCallback(() => walletService.getTokenDetailSettings(), []);
  return useLoadFunction(data);
}

export function useUserDataQuery() {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryUserData'],
    queryFn: () => walletService.getUserData(),
  });
}

export function useHasKeyringsQuery(enabled?: boolean) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryHasKeyring'],
    queryFn: () => walletService.hasKeyrings(),
    enabled,
  });
}

export function usePasswordQuery(enabled?: boolean) {
  const { walletService } = useAppContext();
  // // Don't use query because we don't want to cache sensitive information
  const getPassword = useCallback(async () => {
    const password = await walletService.getPassword();
    return password ?? null;
  }, []);
  return useLoadFunction(getPassword, enabled ?? true);
}

export function useSidepanelBehaviorQuery() {
  return useQuery({
    queryKey: ['querySidepanelBehavior'],
    queryFn: () => chrome.sidePanel.getPanelBehavior(),
  });
}

export function useAutoLockTimeQuery() {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryAutoLockTime'],
    queryFn: () => walletService.getAutoLockTime(),
  });
}
