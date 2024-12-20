import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createIPasswordSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    password: Yup.string().required(localization.schemaEnterPassword[language]),
    confirmPassword: Yup.mixed().test(
      'match',
      localization.schemaPasswordsDoNotMatch[language],
      (_, ctx) => {
        return ctx.parent.password === ctx.parent.confirmPassword;
      },
    ),
    score: Yup.number()
      .integer()
      .min(2, localization.schemaPasswordInsecure[language]),
  });
