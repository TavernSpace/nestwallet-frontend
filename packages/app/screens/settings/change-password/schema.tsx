import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createPasswordSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    password: Yup.string().required(localization.schemaEnterPassword[language]),
  });
