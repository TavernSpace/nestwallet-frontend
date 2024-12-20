import { onLoadable } from '@nestwallet/app/common/utils/query';
import { useLanguageContext } from '@nestwallet/app/provider/language';
import React from 'react';
import { UserContextProvider } from '.';
import { useAuthorizedUserContext } from './auth';

export const withUserContext = <P extends {}>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => {
    const { user, signers, refetch, refetchSigners } =
      useAuthorizedUserContext();
    return (
      <UserContextProvider
        user={user}
        signers={signers}
        refetch={refetch}
        refetchSigners={refetchSigners}
      >
        <Component {...props} />
      </UserContextProvider>
    );
  };
};

// Ensure loading is complete
export const withLoadedLanguage = <P extends {}>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => {
    const { loadableLanguage, defaultLanguage } = useLanguageContext();

    return onLoadable(loadableLanguage)(
      () => null,
      () => (defaultLanguage ? <Component {...props} /> : null),
      () => <Component {...props} />,
    );
  };
};
