import * as Yup from 'yup';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './login/localization';

export const createLoginEmailSectionSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    email: Yup.string()
      .email(localization.schemaEnterValidEmail[language])
      .required(localization.schemaEnterValidEmail[language]),
  });

export const NameSectionSchema = Yup.object().shape({
  name: Yup.string().required(),
});
