import { Origin } from '@nestwallet/app/common/types';
import { QueryOptions } from '@nestwallet/app/common/utils/query';
import { useQuery } from '@tanstack/react-query';
import {
  connectionService,
  tonConnectProvider,
  userService,
  walletConnectProvider,
} from '../provider/constants';

export function useConnectedSiteQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['queryConnectedSite'],
    queryFn: () => connectionService.getCurrentSite(),
    ...options,
  });
}

export function useConnectedSitesQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['queryConnectedSites'],
    queryFn: () => connectionService.getConnectedSites(),
    ...options,
  });
}

export function useBrowserHistoryQuery() {
  return useQuery<Origin[]>({
    queryKey: ['queryBrowserHistory'],
    queryFn: () =>
      userService.getBrowserHistory().then((sites) => sites.reverse() ?? {}),
  });
}

export function useWalletConnectConnectionsQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['queryWalletConnectConnections'],
    queryFn: () => walletConnectProvider.getConnections(),
    ...options,
  });
}

export function useTonConnectConnectionsQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['queryTonConnectConnections'],
    queryFn: () => tonConnectProvider.getConnections(),
    ...options,
  });
}
