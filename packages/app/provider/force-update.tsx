import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import { VersionResponse } from '../common/api/nestwallet/types';
import { Loadable, VoidPromiseFunction } from '../common/types';
import { withDiscardedAsyncResult } from '../common/utils/functions';
import { loadDataFromQuery, spreadLoadable } from '../common/utils/query';
import { useNestWallet } from './nestwallet';

interface IForceUpdateContext {
  version: Loadable<VersionResponse>;
  refetch: VoidPromiseFunction;
}

interface ForceUpdateContextProps {
  children: React.ReactNode;
}

const ForceUpdateContext = createContext<IForceUpdateContext>({} as any);

export function ForceUpdateContextProvider(props: ForceUpdateContextProps) {
  const { children } = props;
  const { apiClient } = useNestWallet();

  const versionQuery = useQuery({
    queryKey: ['versionQuery'],
    queryFn: () => apiClient.getVersion(),
  });

  const version = loadDataFromQuery(versionQuery);

  const context = useMemo(
    () => ({
      version,
      refetch: withDiscardedAsyncResult(versionQuery.refetch),
    }),
    [...spreadLoadable(version)],
  );

  return (
    <ForceUpdateContext.Provider value={context}>
      {children}
    </ForceUpdateContext.Provider>
  );
}

export function useForceUpdateContext() {
  return useContext(ForceUpdateContext);
}
