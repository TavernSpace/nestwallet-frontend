import * as Yup from 'yup';

export const EditProfileSchema = Yup.object().shape({
  name: Yup.string().required(),
});
