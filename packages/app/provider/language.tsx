import { createContext, useContext, useMemo } from 'react';
import { Portal } from 'react-native-paper';
import { Loadable } from '../common/types';
import { spreadLoadable } from '../common/utils/query';
import { ILanguageCode } from '../graphql/client/generated/graphql';

interface ILanguageContext {
  language: ILanguageCode;
  defaultLanguage?: ILanguageCode;
  loadableLanguage: Loadable<ILanguageCode>;
  setLanguage: (language: ILanguageCode) => Promise<void>;
}

export const LanguageContext = createContext<ILanguageContext>({} as any);

export function LanguageContextProvider(props: {
  language: Loadable<ILanguageCode>;
  defaultLanguage?: ILanguageCode;
  onChangeLanguage?: (language: ILanguageCode) => Promise<void>;
  children: React.ReactNode;
}) {
  const {
    language,
    defaultLanguage,
    onChangeLanguage = async () => {},
    children,
  } = props;

  const context: ILanguageContext = useMemo(
    () => ({
      language: !defaultLanguage
        ? language.data!
        : language.data ?? defaultLanguage,
      defaultLanguage,
      loadableLanguage: language,
      setLanguage: onChangeLanguage,
    }),
    [...spreadLoadable(language)],
  );

  return (
    <LanguageContext.Provider value={context}>
      <Portal.Host>{children}</Portal.Host>
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  return useContext(LanguageContext);
}
