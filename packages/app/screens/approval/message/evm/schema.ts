import * as Yup from 'yup';

export const CreateMessageProposalInputSchema = Yup.object().shape({
  description: Yup.string(),
  message: Yup.string().required(),
});
