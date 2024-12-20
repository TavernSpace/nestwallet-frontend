import { faLock } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigationOptions } from '../../../common/hooks/navigation';
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

interface IPasswordInput {
  password: string;
}

export const createIPasswordSchema = (language: ILanguageCode) =>
  Yup.object().shape({
    password: Yup.string().required(localization.passwordSchema[language]),
  });

export function RestoreBackupWithPasswordForm(props: {
  onSubmit: (password: string) => Promise<void>;
}) {
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handleSubmit = async (value: IPasswordInput) => {
    try {
      await props.onSubmit(value.password);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyRestoredBakcup[language],
      });
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.incorrectPassword[language],
      });
    }
  };

  const formik = useFormik<IPasswordInput>({
    initialValues: {
      password: '',
    },
    validationSchema: createIPasswordSchema(language),
    onSubmit: handleSubmit,
  });

  useNavigationOptions({
    title: 'Unlock Backup',
  });

  return (
    <Form className='flex h-full flex-col justify-between' formik={formik}>
      <ScrollView
        className='flex flex-1 flex-col px-4'
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View className='flex flex-col items-center space-y-4 pt-2'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon icon={faLock} size={48} color={colors.primary} />
          </View>
          <Text className='text-text-secondary text-center text-sm font-normal'>
            {localization.enterPassword[language]}
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
          />
        </View>
      </ScrollView>
      <View className='mt-4 space-y-2 px-4'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.passwordInfo[language]}
          </Text>
        </View>
        <TextButton
          onPress={formik.submitForm}
          loading={formik.isSubmitting}
          disabled={formik.isSubmitting}
          text={localization.continue[language]}
        />
      </View>
    </Form>
  );
}
