import * as Yup from 'yup';

export const IPasswordSchema = Yup.object().shape({
  password: Yup.string().required('Please enter your password'),
});
