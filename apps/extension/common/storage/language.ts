import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { getLocalStorage, setLocalStorage } from '.';
import { BackgroundStorageKey } from '../constants/worker/storage';

export const getLocalLanguage = async (): Promise<ILanguageCode> => {
  const data = await getLocalStorage(BackgroundStorageKey.Language);
  const language: ILanguageCode = data ?? ILanguageCode.En;
  return Object.values(ILanguageCode).includes(language)
    ? language
    : ILanguageCode.En;
};

export const setLocalLanguage = async (language: ILanguageCode) => {
  await setLocalStorage(BackgroundStorageKey.Language, language);
};
