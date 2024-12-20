import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createQuickStartSchema = (language: ILanguageCode) =>
  Yup.array().of(
    Yup.string().trim().required(localization.schemaValidName[language]),
  );
