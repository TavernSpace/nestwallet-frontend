import * as Yup from 'yup';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './localization';

export const EditNonceSchema = (nonce: number, language: ILanguageCode) =>
  Yup.object().shape({
    nonce: Yup.number()
      .required(localization.schemaEnterValidNonce[language])
      .min(nonce, localization.schemaNonceGreaterThan(nonce - 1)[language]),
  });

export const EditDescriptionSchema = Yup.object().shape({
  description: Yup.string(),
});

export const CustomGasSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    maxFee: Yup.number().required(
      localization.schemaEnterValidMaxFee[language],
    ),
    maxPriorityFee: Yup.number().required(
      localization.schemaEnterValidMaxPriorityFee[language],
    ),
    gasLimit: Yup.number().required(
      localization.schemaEnterValidGasLimit[language],
    ),
  });
