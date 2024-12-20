import {
  ISignerWallet,
  Loadable,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { withDiscardedAsyncResult } from '@nestwallet/app/common/utils/functions';
import {
  composeLoadables,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { View } from '@nestwallet/app/components/view';
import { getUpdateStatus } from '@nestwallet/app/features/version';
import {
  IUser,
  IUserAccount,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useForceUpdateContext } from '@nestwallet/app/provider/force-update';
import { ConnectionErrorScreen } from '@nestwallet/app/screens/error/connection';
import { ToSSheet } from '@nestwallet/app/screens/tos/sheet';
import { ForceUpdateScreen } from '@nestwallet/app/screens/update/screen';
import { ReactNode, createContext, useContext, useMemo } from 'react';
import { Portal } from 'react-native-paper';
import { useLocalLanguageContext } from '../local-language';

interface IUserContext {
  user: IUser;
  accounts: IUserAccount[];
  wallets: IWallet[];
  signers: ISignerWallet[];
  refetch: VoidPromiseFunction;
  refetchSigners: VoidPromiseFunction;
}

export const UserContext = createContext<IUserContext>({} as any);

export function UserContextProvider(props: {
  user: Loadable<IUser | null>;
  signers: Loadable<ISignerWallet[]>;
  refetch: VoidPromiseFunction;
  refetchSigners: VoidPromiseFunction;
  children: ReactNode;
}) {
  const {
    user,
    signers,
    refetch: refetchUser,
    refetchSigners,
    children,
  } = props;
  const { version, refetch: refetchVersion } = useForceUpdateContext();
  const { language } = useLocalLanguageContext();

  // Note: once use is fetched its important to not load again, since the queryKey of user is always the same, refetching
  // user won't cause loading to be true, but signerQuery depends on a key so it can reload again
  const userContext = useMemo(
    () =>
      composeLoadables(
        user,
        signers,
      )(
        (user, signers) =>
          user && {
            user,
            accounts: user.accounts,
            wallets: user.accounts.flatMap((account) =>
              account.organization.wallets.sort((a, b) => a.rank - b.rank),
            ),
            signers,
            refetch: refetchUser,
            refetchSigners,
          },
      ),
    [user, signers],
  );

  const refetch = async () => Promise.all([refetchUser(), refetchVersion()]);

  // TODO: add better loading state
  return onLoadable(userContext)(
    () => (
      <Portal>
        <View className='bg-background flex h-full items-center justify-center'>
          <ActivityIndicator />
        </View>
      </Portal>
    ),
    // TODO: this is not necessarily only error, technically signer or id fetch from background storage can fail
    () => (
      <Portal>
        <ConnectionErrorScreen
          language={language}
          onRetry={withDiscardedAsyncResult(refetch)}
        />
      </Portal>
    ),
    (data) => {
      const { isUpdateRequired } = version.success
        ? getUpdateStatus(version.data)
        : { isUpdateRequired: false };
      // TODO: handle ui where update is recommended but not required
      // Note: the only time the data is null is when we are unauthorized and about to be redirected, or we fetched the user and need to
      // still fetch populate the other data (this should be very fast), we set it to null to avoid showing the error screen
      return isUpdateRequired ? (
        <Portal>
          <ForceUpdateScreen />
        </Portal>
      ) : data ? (
        <>
          <UserContext.Provider value={data}>{children}</UserContext.Provider>
          <ToSSheet
            isShowing={!data.user.hasAcceptedTos}
            onAccept={refetchUser}
          />
        </>
      ) : null;
    },
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
