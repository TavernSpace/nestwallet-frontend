import * as Yup from 'yup';

export const CreateProposalInputSchema = Yup.object().shape({
  description: Yup.string(),
  chainId: Yup.number().integer().required(),
  toAddress: Yup.string().required(),
  value: Yup.string().required(),
});
