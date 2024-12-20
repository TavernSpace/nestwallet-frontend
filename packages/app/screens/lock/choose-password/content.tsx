// TODO: should code split this
import { faLock } from '@fortawesome/pro-solid-svg-icons';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { useFormik } from 'formik';
import { PasswordStrengthBar } from '.';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { PasswordInput } from '../../../components/text-input/password';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createIPasswordSchema } from './schema';

interface IPasswordInput {
  password: string;
  confirmPassword: string;
  score: number;
}

interface ChoosePasswordContentProps {
  onSubmit: (password: string) => Promise<void>;
}

export function ChoosePasswordContent(props: ChoosePasswordContentProps) {
  const { onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handlePasswordChange = (password: string) => {
    formik.handleChange('password')(password);
    const options = {
      dictionary: {
        ...zxcvbnCommonPackage.dictionary,
        ...zxcvbnEnPackage.dictionary,
      },
      graphs: zxcvbnCommonPackage.adjacencyGraphs,
      translations: zxcvbnEnPackage.translations,
    };
    zxcvbnOptions.setOptions(options);
    const result = zxcvbn(password);
    const score = password.length === 0 ? -1 : result.score;
    formik.values.score = score;
  };

  const handleSubmit = async (value: IPasswordInput) => {
    try {
      await onSubmit(value.password);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.unableToResetPassword[language],
      });
    }
  };

  const formik = useFormik<IPasswordInput>({
    initialValues: {
      password: '',
      confirmPassword: '',
      score: -1,
    },
    validationSchema: createIPasswordSchema(language),
    onSubmit: handleSubmit,
  });

  return (
    <View className='bg-background flex h-full w-full flex-col justify-between px-4'>
      <View className='flex flex-col'>
        <View className='flex h-8 flex-row items-center justify-between'>
          <View className='bg-primary/10 h-8 w-8 items-center justify-center rounded-full'>
            <FontAwesomeIcon icon={faLock} color={colors.primary} size={16} />
          </View>
          <Text className='text-text-primary text-center text-base font-medium'>
            {localization.createPassword[language]}
          </Text>
          <View className='h-8 w-8' />
        </View>
        <View className='mt-6 w-full space-y-2'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.password[language]}
          </Text>
          <PasswordInput
            password={formik.values.password}
            errorText={
              !formik.touched.password
                ? undefined
                : formik.errors.password
                ? formik.errors.password
                : formik.values.score !== -1
                ? formik.errors.score
                : undefined
            }
            onPasswordChange={handlePasswordChange}
          />
          <PasswordStrengthBar score={formik.values.score} />
        </View>
        <View className='mt-4 w-full space-y-2'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.confirmPassword[language]}
          </Text>
          <PasswordInput
            password={formik.values.confirmPassword}
            placeholder={localization.reenterPassword[language]}
            errorText={
              formik.touched.confirmPassword
                ? formik.errors.confirmPassword
                : undefined
            }
            onPasswordChange={formik.handleChange('confirmPassword')}
            onSubmit={formik.submitForm}
          />
        </View>
      </View>
      <View className='flex flex-col space-y-2'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.passwordLocalMessage[language]}
          </Text>
        </View>
        <TextButton
          onPress={formik.submitForm}
          loading={formik.isSubmitting}
          disabled={
            formik.isSubmitting ||
            !formik.values.password ||
            !formik.values.confirmPassword
          }
          text={localization.continue[language]}
        />
      </View>
    </View>
  );
}
