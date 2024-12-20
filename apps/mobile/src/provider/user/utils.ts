import { NestWalletClientEvents } from '@nestwallet/app/common/api/nestwallet/types';
import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { Nullable, UserData } from '@nestwallet/app/common/types';
import { empty, id } from '@nestwallet/app/common/utils/functions';
import { QueryOptions } from '@nestwallet/app/common/utils/query';
import { getWalletsWithMetadata } from '@nestwallet/app/features/wallet/utils';
import { IUser } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../application';
import { useAuthContext } from '../auth';

export function useInitialize() {
  const { userService } = useAppContext();
  const { logout } = useAuthContext();
  const { apiClient, eventEmitter } = useNestWallet();
  const resetTo = useResetTo();

  const logoutTriggeredRef = useRef(false);

  const [userData, setUserData] = useState<Nullable<UserData>>(undefined);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userSessionData = await userService.getUserSessionData();
        apiClient.setUserData(userSessionData.user);
        setUserData(userSessionData.user);
      } catch (err) {
        logoutTriggeredRef.current = true;
        await logout().catch(empty);
        setUserData(null);
        resetTo('auth', { screen: 'login' });
      }
    };

    const handleUnauthorizedError = async () => {
      if (!logoutTriggeredRef.current) {
        logoutTriggeredRef.current = true;
        await logout().catch(id);
        resetTo('auth', { screen: 'login' });
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
  options?: QueryOptions,
) {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['personalSigners', user],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      const keyringsMetadata = await walletService.getUserKeyringsMetadata(
        user.id,
      );
      return getWalletsWithMetadata(user, keyringsMetadata);
    },
    ...options,
  });
}
