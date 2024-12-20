import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createUpdateEmailSchema = (
  currentEmail: string | null,
  language: ILanguageCode,
) =>
  Yup.object().shape({
    email: Yup.string()
      .email(localization.schemaEnterValidEmail[language])
      .notOneOf([currentEmail], localization.schemaCurrentEmail[language])
      .required(localization.schemaEnterValidEmail[language]),
  });
