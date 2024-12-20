import { NestWalletClientEvents } from '@nestwallet/app/common/api/nestwallet/types';
import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import {
  ISignerWallet,
  Nullable,
  UserData,
} from '@nestwallet/app/common/types';
import { id } from '@nestwallet/app/common/utils/functions';
import { getWalletsWithMetadata } from '@nestwallet/app/features/wallet/utils';
import { IUser } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo';
import { QueryObserverOptions, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../application';
import { useAuthContext } from '../auth';

export function useInitialize(
  redirect?: To<
    ReactNavigation.RootParamList,
    keyof ReactNavigation.RootParamList
  >,
) {
  const { walletService } = useAppContext();
  const { logout } = useAuthContext();
  const { apiClient, eventEmitter } = useNestWallet();
  const resetTo = useResetTo();

  const logoutTriggeredRef = useRef(false);

  const [userData, setUserData] = useState<Nullable<UserData>>(undefined);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await walletService.getUserData();
        apiClient.setUserData(userData);
        setUserData(userData);
      } catch (err) {
        logoutTriggeredRef.current = true;
        await logout().catch(id);
        resetTo('auth', { screen: 'login', params: { redirect } });
      }
    };

    const handleUnauthorizedError = async () => {
      if (!logoutTriggeredRef.current) {
        logoutTriggeredRef.current = true;
        await logout().catch(id);
        resetTo('auth', { screen: 'login', params: { redirect } });
      }
    };

    initialize();

    eventEmitter.addListener(
      NestWalletClientEvents.RequiresLogin,
      handleUnauthorizedError,
    );

    return () => {
      eventEmitter.removeListener(
        NestWalletClientEvents.RequiresLogin,
        handleUnauthorizedError,
      );
    };
  }, []);

  return { isInitialized: !!userData, userData };
}

export function usePersonalSignersQuery(
  user: IUser | undefined,
  options?: Partial<QueryObserverOptions<ISignerWallet[]>>,
) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['personalSigners', user],
    queryFn: async (): Promise<ISignerWallet[]> => {
      if (!user) {
        return [];
      }
      const keyringsMetadata = await walletService.getKeyringsMetadata();
      return getWalletsWithMetadata(user, keyringsMetadata);
    },
    ...options,
  });
}
