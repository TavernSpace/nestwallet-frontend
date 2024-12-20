import { useLoadFunction } from '@nestwallet/app/common/hooks/loading';
import { Loadable } from '@nestwallet/app/common/types';
import { spreadLoadable } from '@nestwallet/app/common/utils/query';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { createContext, useContext, useMemo } from 'react';
import {
  getLocalLanguage,
  setLocalLanguage,
} from '../../common/storage/language';

interface ILocalLanguageContext {
  language: Loadable<ILanguageCode>;
  setLanguage: (language: ILanguageCode) => Promise<void>;
}

export const LocalLanguageContext = createContext<ILocalLanguageContext>(
  {} as any,
);

export function LocalLanguageContextProvider(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  const { data: language, refetch } = useLoadFunction(getLocalLanguage);

  const setLanguage = async (language: ILanguageCode) => {
    await setLocalLanguage(language);
    await refetch();
  };

  const context: ILocalLanguageContext = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [...spreadLoadable(language)],
  );

  return (
    <LocalLanguageContext.Provider value={context}>
      {children}
    </LocalLanguageContext.Provider>
  );
}

export function useLocalLanguageContext() {
  return useContext(LocalLanguageContext);
}
