import * as Yup from 'yup';
import { onBlockchain } from '../../../features/chain';
import {
  IBlockchainType,
  ILanguageCode,
} from '../../../graphql/client/generated/graphql';
import { localization } from './localization';

export const maxLengths = {
  [IBlockchainType.Evm]: 64,
  [IBlockchainType.Svm]: 88,
  [IBlockchainType.Tvm]: 128,
};

export function getPrivateKeySchema(
  blockchain: IBlockchainType,
  language: ILanguageCode,
) {
  const maxLength = maxLengths[blockchain];
  return onBlockchain(blockchain)(
    () =>
      Yup.object().shape({
        key: Yup.string()
          .trim()
          .min(
            maxLength,
            localization.schemaCharacterLengthExact(maxLength)[language],
          )
          .max(
            maxLength,
            localization.schemaCharacterLengthExact(maxLength)[language],
          )
          .matches(
            /^[0-9A-Fa-f]+$/,
            localization.schemaHexCharacters[language],
          ),
      }),
    () =>
      Yup.object().shape({
        key: Yup.string()
          .trim()
          .min(
            maxLength - 1,
            localization.schemaCharacterLengthRangeSol(maxLength)[language],
          )
          .max(
            maxLength,
            localization.schemaCharacterLengthRangeSol(maxLength)[language],
          )
          .matches(
            /^[1-9A-HJ-NP-Za-km-z]+$/,
            localization.schemaBase58Characters[language],
          ),
      }),
    () =>
      Yup.object().shape({
        key: Yup.string()
          .trim()
          .min(
            maxLength,
            localization.schemaCharacterLengthExact(maxLength)[language],
          )
          .max(
            maxLength,
            localization.schemaCharacterLengthExact(maxLength)[language],
          )
          .matches(
            /^[0-9A-Fa-f]+$/,
            localization.schemaHexCharacters[language],
          ),
      }),
  );
}
