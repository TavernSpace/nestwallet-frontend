import * as Yup from 'yup';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './localization';

export interface MultichainDeployInput {
  chainId: number;
  name: string;
  color?: string;
}

export const createMultiDeployChainSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    name: Yup.string().required(localization.schemaEnterName[language]),
    color: Yup.string().required(localization.schemaSelectColor[language]),
    chainId: Yup.number()
      .min(1)
      .integer()
      .required(localization.schemaSelectChain[language]),
  });
