import { Loadable, Preferences } from '@nestwallet/app/common/types';
import {
  loadDataFromQuery,
  spreadLoadable,
} from '@nestwallet/app/common/utils/query';
import { AudioContextProvider } from '@nestwallet/app/provider/audio';
import { createContext, useContext, useMemo } from 'react';
import { usePreferencesQuery } from '../hooks/wallet';

interface IPreferencesContext {
  preferences: Loadable<Preferences>;
}

const PreferencesContext = createContext<IPreferencesContext>(
  {} as IPreferencesContext,
);

export function PreferencesContextProvider(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const preferencesQuery = usePreferencesQuery();
  const preferences = loadDataFromQuery(preferencesQuery);

  const context = useMemo(
    () => ({
      preferences,
    }),
    [...spreadLoadable(preferences)],
  );

  return (
    <PreferencesContext.Provider value={context}>
      <AudioContextProvider preferences={preferences}>
        {children}
      </AudioContextProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferenceContext() {
  return useContext(PreferencesContext);
}
