import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export function createChooseNamesSchema(language: ILanguageCode) {
  return Yup.array(
    Yup.object({
      name: Yup.string()
        .trim()
        .required(localization.schemaNameError[language]),
    }),
  );
}
