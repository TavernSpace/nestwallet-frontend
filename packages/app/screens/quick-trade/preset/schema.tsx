import * as Yup from 'yup';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const AbsolutePresetsSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    amount0: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .positive(localization.schemaAmountMustBePositive[language]),
    amount1: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .positive(localization.schemaAmountMustBePositive[language]),
    amount2: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .positive(localization.schemaAmountMustBePositive[language]),
  });

export const PercentagePresetsSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    amount0: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .integer(localization.schemaMustBeAnInteger[language])
      .positive(localization.schemaAmountMustBePositive[language])
      .max(100, localization.schemaMustBeNoGreaterThan100Percent[language]),
    amount1: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .integer(localization.schemaMustBeAnInteger[language])
      .positive(localization.schemaAmountMustBePositive[language])
      .max(100, localization.schemaMustBeNoGreaterThan100Percent[language]),
    amount2: Yup.number()
      .typeError(localization.schemaAmountMustBeValidNumber[language])
      .required(localization.schemaPleaseEnterValidAmount[language])
      .integer(localization.schemaMustBeAnInteger[language])
      .positive(localization.schemaAmountMustBePositive[language])
      .max(100, localization.schemaMustBeNoGreaterThan100Percent[language]),
  });
