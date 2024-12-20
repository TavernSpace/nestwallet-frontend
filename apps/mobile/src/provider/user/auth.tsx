import {
  useEffectOnInitialSuccess,
  useEffectOnSuccess,
} from '@nestwallet/app/common/hooks/loading';
import { useQueryRefetcher } from '@nestwallet/app/common/hooks/query';
import {
  ISignerWallet,
  Loadable,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { withDiscardedAsyncResult } from '@nestwallet/app/common/utils/functions';
import {
  altLoadableError,
  composeLoadables,
  loadDataFromQuery,
  makeLoadable,
  makeLoadableLoading,
  mapLoadable,
  spreadLoadable,
} from '@nestwallet/app/common/utils/query';
import { AuthorizationError } from '@nestwallet/app/features/errors/http/types';
import {
  ILanguageCode,
  IUser,
  useCurrentUserQuery,
  useUpdateLanguageMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { LanguageContextProvider } from '@nestwallet/app/provider/language';
import { VerifyExecutionContextProvider } from '@nestwallet/app/provider/verify-execution';
import { useNavigation } from '@react-navigation/native';
import { focusManager, keepPreviousData } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { AppState } from 'react-native';
import { initializeTonConnectDeepLinks } from '../../hooks/tonconnect';
import { useAppContext } from '../application';
import { useLocalLanguageContext } from '../local-language';
import { LockContextProvider } from '../lock';
import { useInitialize, usePersonalSignersQuery } from './utils';

interface IAuthorizedUserContext {
  user: Loadable<IUser | null>;
  signers: Loadable<ISignerWallet[]>;
  refetch: VoidPromiseFunction;
  refetchSigners: VoidPromiseFunction;
}

export const AuthorizedUserContext = createContext<IAuthorizedUserContext>(
  {} as any,
);

export function AuthorizedUserContextProvider(props: {
  main?: boolean;
  children: ReactNode;
}) {
  const { main = true, children } = props;
  const { isInitialized, userData } = useInitialize();
  const {
    ethereumService,
    solanaService,
    tonService,
    walletConnectProvider,
    tonConnectProvider,
  } = useAppContext();
  const { language, setLanguage } = useLocalLanguageContext();
  const navigation = useNavigation();

  const initializedLoadable = isInitialized
    ? makeLoadable(null)
    : makeLoadableLoading<null>();

  const updateUserMutation = useUpdateLanguageMutation();

  const currentUserQuery = useQueryRefetcher(
    [
      graphqlType.Organization,
      graphqlType.User,
      graphqlType.UserAccount,
      graphqlType.UserIdentity,
      graphqlType.Wallet,
      graphqlType.Signer,
      graphqlType.Notification,
    ],
    useCurrentUserQuery({}, { enabled: isInitialized }),
  );
  const user = loadDataFromQuery(
    currentUserQuery,
    (data) => data.currentUser as IUser,
  );
  const authorizedUser = altLoadableError(user)(() =>
    currentUserQuery.error instanceof AuthorizationError
      ? makeLoadable(null)
      : user,
  );

  const signersQuery = useQueryRefetcher(
    graphqlType.Signer,
    usePersonalSignersQuery(user.data, {
      placeholderData: keepPreviousData,
    }),
  );
  const signers = loadDataFromQuery(signersQuery);

  // set badge whenever we get updated notification count
  useEffectOnSuccess(user, (userData) => {
    const totalCount = userData.notificationCount;
    Notifications.setBadgeCountAsync(totalCount);
  });

  // initialize and uninitialize services and providers for walletconnect and tonconnect
  useEffectOnInitialSuccess(user, () => {
    if (main) {
      ethereumService.initialize(navigation);
      solanaService.initialize(navigation);
      tonService.initialize({ navigation, tonConnectProvider });
      walletConnectProvider.initialize();
      tonConnectProvider
        .initialize()
        .then(() => initializeTonConnectDeepLinks());
    }
  });

  useEffect(() => {
    return () => {
      if (main) {
        ethereumService.uninitialize();
        solanaService.uninitialize();
        tonService.uninitialize();
        walletConnectProvider.uninitialize();
        tonConnectProvider.uninitialize();
      }
    };
  }, []);

  // Refetch queries when app is reopened from paused state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (
      main &&
      user.data &&
      language.data &&
      user.data.language !== language.data
    ) {
      setLanguage(user.data.language);
    }
  }, [...spreadLoadable(user), ...spreadLoadable(language)]);

  const authorizedUserContext = useMemo(() => {
    return {
      user: composeLoadables(
        initializedLoadable,
        authorizedUser,
      )((_, user) => user),
      signers,
      refetch: withDiscardedAsyncResult(() =>
        Promise.all([currentUserQuery.refetch(), signersQuery.refetch()]),
      ),
      refetchSigners: withDiscardedAsyncResult(signersQuery.refetch),
    };
  }, [...spreadLoadable(user), ...spreadLoadable(signers), isInitialized]);

  const handleChangeLanguage = async (language: ILanguageCode) => {
    await updateUserMutation.mutateAsync({ language });
    await setLanguage(language);
    await currentUserQuery.refetch();
  };

  return main ? (
    <LanguageContextProvider
      language={mapLoadable(user)((user) => user.language)}
      onChangeLanguage={handleChangeLanguage}
    >
      <AuthorizedUserContext.Provider value={authorizedUserContext}>
        <LockContextProvider userData={userData}>
          <VerifyExecutionContextProvider>
            {children}
          </VerifyExecutionContextProvider>
        </LockContextProvider>
      </AuthorizedUserContext.Provider>
    </LanguageContextProvider>
  ) : (
    <LanguageContextProvider
      language={mapLoadable(user)((user) => user.language)}
      onChangeLanguage={handleChangeLanguage}
    >
      <AuthorizedUserContext.Provider value={authorizedUserContext}>
        {children}
      </AuthorizedUserContext.Provider>
    </LanguageContextProvider>
  );
}

export function useAuthorizedUserContext() {
  return useContext(AuthorizedUserContext);
}
