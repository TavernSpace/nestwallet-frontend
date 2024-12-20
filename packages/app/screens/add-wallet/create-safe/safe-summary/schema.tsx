import * as Yup from 'yup';
import { ILanguageCode } from '../../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const ChangeThresholdInputSchema = (
  signerCount: number,
  language: ILanguageCode,
) =>
  Yup.object().shape({
    threshold: Yup.number()
      .integer()
      .positive(localization.positiveThreshold[language])
      .required()
      .test((value, ctx) => {
        if (!value) {
          return ctx.createError({
            message: localization.invalidThreshold[language],
          });
        } else if (value > signerCount) {
          return ctx.createError({
            message: localization.tooLargeThreshold[language],
          });
        } else {
          return true;
        }
      }),
  });

export const ChangeNameInputSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    name: Yup.string().trim().required(localization.invalidName[language]),
  });
