import * as Yup from 'yup';

export const AddContactSchema = Yup.object().shape({
  name: Yup.string().required('Please enter a name for the contact'),
});
