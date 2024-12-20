import * as Yup from 'yup';

export const UpsertWalletInputSchema = Yup.object().shape({
  name: Yup.string().required('Please enter a valid name for your wallet'),
});
