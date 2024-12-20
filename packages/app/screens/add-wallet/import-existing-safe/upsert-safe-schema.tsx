import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';
export function createUpsertWalletInputSchema(language: ILanguageCode) {
  return Yup.object().shape({
    name: Yup.string().required(localization.schemaNameError[language]),
    chainId: Yup.number()
      .min(1, localization.schemaChainError[language])
      .integer()
      .required(localization.schemaChainError[language]),
  });
}
