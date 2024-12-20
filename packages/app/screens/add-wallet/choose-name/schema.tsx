import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export function createNameSchema(language: ILanguageCode) {
  return Yup.object().shape({
    name: Yup.string().trim().required(localization.schemaNameError[language]),
  });
}
