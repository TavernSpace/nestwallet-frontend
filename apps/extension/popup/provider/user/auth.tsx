import { useEffectOnSuccess } from '@nestwallet/app/common/hooks/loading';
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
import type { To } from '@react-navigation/native/lib/typescript/src/useLinkTo';
import { keepPreviousData } from '@tanstack/react-query';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useLocalLanguageContext } from '../local-language';
import { LockContextProvider } from '../lock';
import { useInitialize, usePersonalSignersQuery } from './utils';

interface IAuthorizedUserContext {
  user: Loadable<IUser | null>;
  signers: Loadable<ISignerWallet[]>;
  refetch: VoidPromiseFunction;
  refetchSigners: VoidPromiseFunction;
}

const AuthorizedUserContext = createContext<IAuthorizedUserContext>({} as any);

export function AuthorizedUserContextProvider(props: {
  children: ReactNode;
  redirect?: To<
    ReactNavigation.RootParamList,
    keyof ReactNavigation.RootParamList
  >;
}) {
  const { redirect, children } = props;
  const { isInitialized, userData } = useInitialize(redirect);
  const { language, setLanguage } = useLocalLanguageContext();

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
    usePersonalSignersQuery(user.data, { placeholderData: keepPreviousData }),
  );
  const signers = loadDataFromQuery(signersQuery);

  // set chrome badge whenever we get updated notification count
  useEffectOnSuccess(user, (userData) => {
    const totalCount = userData.notificationCount;
    chrome.action.setBadgeText({
      text: totalCount > 0 ? `${totalCount}` : '',
    });
  });

  useEffect(() => {
    if (user.data && language.data && user.data.language !== language.data) {
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
  }, [
    ...spreadLoadable(authorizedUser),
    ...spreadLoadable(signers),
    isInitialized,
  ]);

  const handleChangeLanguage = async (language: ILanguageCode) => {
    await updateUserMutation.mutateAsync({ language });
    await setLanguage(language);
    await currentUserQuery.refetch();
  };

  return (
    <LanguageContextProvider
      language={mapLoadable(user)((user) => user.language)}
      onChangeLanguage={handleChangeLanguage}
    >
      <AuthorizedUserContext.Provider value={authorizedUserContext}>
        <LockContextProvider initialized={isInitialized} userData={userData}>
          <VerifyExecutionContextProvider>
            {children}
          </VerifyExecutionContextProvider>
        </LockContextProvider>
      </AuthorizedUserContext.Provider>
    </LanguageContextProvider>
  );
}

export function useAuthorizedUserContext() {
  return useContext(AuthorizedUserContext);
}
