import { useEffectOnInitialSuccess } from '@nestwallet/app/common/hooks/loading';
import {
  Nullable,
  UserData,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { tuple } from '@nestwallet/app/common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  makeLoadable,
  makeLoadableLoading,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '@nestwallet/app/common/utils/query';
import { ExtEthersSigner } from '@nestwallet/app/features/evm/ethers/ext-signer';
import { ExtSvmSigner } from '@nestwallet/app/features/svm/signer/ext-signer';
import { ExtTvmSigner } from '@nestwallet/app/features/tvm/signer/ext-signer';
import { IProtectedWalletClient } from '@nestwallet/app/features/wallet/service/interface';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { WalletLockSheet } from '@nestwallet/app/screens/lock/sheet';
import { createContext, useContext, useMemo } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { PasswordAlarmKey } from '../../common/constants/worker/alarms';
import {
  useAutoLockTimeQuery,
  useHasKeyringsQuery,
  usePasswordQuery,
} from '../hooks/ui-service';
import { useAppContext } from './application';
import { useAuthorizedUserContext } from './user/auth';

interface ILockContext {
  isLocked: boolean;
  lock: VoidPromiseFunction;
  unlock: (password?: string) => Promise<void>;
  changePassword: (newPassword: string, reset: boolean) => Promise<void>;
  client: IProtectedWalletClient;
}

const LockContext = createContext<ILockContext>({} as any);

// TODO: what happens if the refetch calls fail after we update the passwords?
export function LockContextProvider(props: {
  initialized: boolean;
  userData: Nullable<UserData>;
  children: React.ReactNode;
}) {
  const { initialized, userData, children } = props;
  const { apiClient } = useNestWallet();
  const { walletService } = useAppContext();
  const { user, refetchSigners } = useAuthorizedUserContext();

  const { data: password, refetch: refetchPassword } =
    usePasswordQuery(initialized);

  const hasKeyringsQuery = useHasKeyringsQuery(initialized);
  const hasKeyrings = loadDataFromQuery(hasKeyringsQuery);

  const autoLockTimeQuery = useAutoLockTimeQuery();
  const autoLockTime = loadDataFromQuery(autoLockTimeQuery);

  const lockContext = useMemo(
    () =>
      mapLoadable(password)((password) => {
        const unlock = async (override?: string) => {
          if (override) {
            await walletService.unlock(override, true);
          } else if (password) {
            await walletService.unlock(password, true);
          }
        };
        const changePassword = async (newPassword: string, reset: boolean) => {
          if (!reset) {
            if (!password) return;
            await withLocking(async () => {
              await walletService.changePassword(password, newPassword);
              await refetch();
            });
          } else {
            await handleCreatePassword(newPassword);
          }
        };
        return {
          isLocked: !password,
          lock: async () => {
            await walletService.lock();
            await refetch();
          },
          unlock,
          changePassword,
          client: {
            isLocked: false as const,
            unlock,
            getEvmSigner: async (
              chainId: number,
              wallet: IWallet,
              usePrivateRPC?: boolean,
              useMevProtect?: boolean,
            ) => {
              await unlock();
              return new ExtEthersSigner(walletService, chainId, wallet, {
                apiClient: usePrivateRPC ? apiClient : undefined,
                mevProtection: useMevProtect ?? false,
              });
            },
            // TODO: should we unlock after every signer operation?
            getSvmSigner: async (chainId: number, wallet: IWallet) => {
              await unlock();
              return new ExtSvmSigner(walletService, wallet);
            },
            getTvmSigner: async (chainId: number, wallet: IWallet) => {
              await unlock();
              return new ExtTvmSigner(walletService, wallet);
            },
            getKeyring: async (keyringIdentifier: string) => {
              await unlock();
              return walletService.getKeyring(keyringIdentifier);
            },
            resolveApproval: walletService.resolveApproval.bind(walletService),
          },
        };
      }),
    [
      ...spreadLoadable(password),
      ...spreadLoadable(hasKeyrings),
      ...spreadLoadable(autoLockTime),
      initialized,
    ],
  );

  const refetch = async () => {
    await Promise.all([refetchPassword(), hasKeyringsQuery.refetch()]);
  };

  const withLocking = async (unlocker: VoidPromiseFunction) => {
    if (autoLockTime.data !== 0) {
      await walletService.resetAutoLockTimer();
    }
    await unlocker();
    if (autoLockTime.data === 0) {
      await walletService.resetAutoLockTimer();
    }
  };

  const handleUnlock = (password: string) =>
    withLocking(async () => {
      await walletService.unlock(password, false);
      await refetch();
    });

  const handleCreatePassword = (password: string) =>
    withLocking(async () => {
      await walletService.resetPassword(password);
      await refetch();
    });

  const handleReset = () =>
    withLocking(async () => {
      await walletService.resetKeyrings();
      await Promise.all([refetch(), refetchSigners()]);
    });

  // This handles any edge cases where the alarm didn't work or trigger for some reason
  const handleTryPopulateAlarm = async (lockTime: number) => {
    if (lockTime === 0) {
      await walletService.resetAutoLockTimer();
    } else {
      const alarm = await browser.alarms.get(PasswordAlarmKey);
      if (!alarm) {
        await walletService.resetAutoLockTimer();
      }
    }
  };

  const initLoadable = initialized ? makeLoadable(null) : makeLoadableLoading();

  useEffectOnInitialSuccess(
    composeLoadables(password, autoLockTime, initLoadable)(tuple),
    ([password, autoLockTime]) => {
      if (password) {
        handleTryPopulateAlarm(autoLockTime);
      }
    },
  );

  return onLoadable(
    composeLoadables(
      lockContext,
      hasKeyrings,
      password,
      initLoadable,
      autoLockTime,
    )(tuple),
  )(
    () => null,
    // TODO: handle error
    () => null,
    ([context, hasKeyrings, password]) => (
      <>
        <LockContext.Provider value={context}>{children}</LockContext.Provider>
        {userData && user.data && (
          <WalletLockSheet
            isShowing={!password || !hasKeyrings}
            hasKeyrings={hasKeyrings}
            onUnlock={handleUnlock}
            onReset={handleReset}
            onCreatePassword={handleCreatePassword}
          />
        )}
      </>
    ),
  );
}

export function useLockContext() {
  return useContext(LockContext);
}
