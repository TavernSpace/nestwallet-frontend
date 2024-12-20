import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createPromoCodeClaimSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    code: Yup.string().required(localization.schemaPromoCodeRequired[language]),
  });
