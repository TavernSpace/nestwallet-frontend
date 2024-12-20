import * as Yup from 'yup';
import { isEVMAddress } from '../../../features/evm/utils';
import { isSolanaAddress } from '../../../features/svm/utils';
import { isTONAddress } from '../../../features/tvm/utils';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const createUpsertContactInputSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    name: Yup.string().required(localization.schemaEnterContactName[language]),
    address: Yup.string()
      .required(localization.schemaEnterValidAddress[language])
      .test({
        name: 'validate-address',
        message: localization.schemaEnterValidAddress[language],
        test: function (value) {
          if (!value) {
            return this.createError({
              message: localization.schemaAddressCannotBeEmpty[language],
            });
          }
          return (
            isEVMAddress(value) ||
            isSolanaAddress(value) ||
            isTONAddress(value) ||
            this.createError({
              message: localization.schemaEnterValidAddress[language],
            })
          );
        },
      }),
    organizationId: Yup.string()
      .uuid()
      .required(localization.schemaSelectOrganization[language]),
  });
