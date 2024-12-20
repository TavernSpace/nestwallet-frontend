import { faLock } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { useRef } from 'react';
import { TextInput } from 'react-native';
import * as Yup from 'yup';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { PasswordInput } from '../../../components/text-input/password';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export const createIPasswordSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    password: Yup.string().required(localization.schemaEnterPassword[language]),
    confirmPassword: Yup.mixed()
      .required(localization.schemaReenterPassword[language])
      .test(
        'match',
        localization.schemaPasswordMismatch[language],
        (_, ctx) => {
          return ctx.parent.password === ctx.parent.confirmPassword;
        },
      ),
  });

export interface IPasswordInput {
  password: string;
  confirmPassword: string;
}

export function UploadBackupWithPasswordForm(props: {
  onSubmit: (password: string) => Promise<void>;
}) {
  const { onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async (value: IPasswordInput) => {
    try {
      await onSubmit(value.password);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message:
          err instanceof Error
            ? err.message
            : localization.cannotBackupSigners[language],
      });
    }
  };

  const formik = useFormik<IPasswordInput>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: createIPasswordSchema(language),
    onSubmit: handleSubmit,
  });

  return (
    <Form className='flex h-full flex-col justify-between' formik={formik}>
      <ScrollView
        className='px-4'
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View className='flex flex-col items-center space-y-4'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon icon={faLock} size={48} color={colors.primary} />
          </View>
          <Text className='text-text-secondary text-center text-sm font-normal'>
            {localization.choosePassword[language]}
          </Text>
        </View>

        <View className='mt-4 w-full space-y-2'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.password[language]}
          </Text>
          <PasswordInput
            id={'password'}
            password={formik.values.password}
            errorText={
              formik.touched.password ? formik.errors.password : undefined
            }
            onPasswordChange={formik.handleChange('password')}
            onSubmit={() => confirmPasswordRef.current?.focus()}
          />
        </View>
        <View className='mt-4 w-full space-y-2'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.confirmPassword[language]}
          </Text>
          <PasswordInput
            ref={confirmPasswordRef}
            id={'confirm_password'}
            password={formik.values.confirmPassword}
            errorText={
              formik.touched.confirmPassword
                ? formik.errors.confirmPassword
                : undefined
            }
            onPasswordChange={formik.handleChange('confirmPassword')}
            onSubmit={formik.submitForm}
          />
        </View>
      </ScrollView>
      <View className='flex flex-col space-y-2 px-4'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.chooseStrongPassword[language]}
          </Text>
        </View>
        <TextButton
          onPress={formik.submitForm}
          loading={formik.isSubmitting}
          disabled={
            formik.isSubmitting ||
            formik.values.password.length === 0 ||
            formik.values.confirmPassword.length === 0
          }
          text={localization.backup[language]}
        />
      </View>
    </Form>
  );
}
