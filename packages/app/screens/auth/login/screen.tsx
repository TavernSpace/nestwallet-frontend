import { faEnvelope, faLaptopMobile } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { GenerateSignInCodeInput } from '../../../common/api/nestwallet/types';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { NestLight } from '../../../components/logo/nest';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { createLoginEmailSectionSchema } from '../schema';
import { localization } from './localization';

interface LoginScreenProps {
  onPrivateSignIn: VoidPromiseFunction;
  onGenerateSignInCode: (input: GenerateSignInCodeInput) => Promise<void>;
}

export function LoginScreen(props: LoginScreenProps) {
  const { onPrivateSignIn, onGenerateSignInCode } = props;
  const { showSnackbar } = useSnackbar();
  const { bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (input: GenerateSignInCodeInput) => {
    try {
      await onGenerateSignInCode(input);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.codeHasBeenSent[language],
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handlePrivateSignIn = async () => {
    try {
      setLoading(true);
      await onPrivateSignIn();
    } catch (err) {
      const error = parseError(err, localization.errorSigningIn[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<GenerateSignInCodeInput>({
    initialValues: {
      email: '',
    },
    validationSchema: createLoginEmailSectionSchema(language),
    onSubmit: handleSubmit,
  });

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={false}
        hasTopInset={true}
      >
        <View className='flex-1'>
          <View className='flex flex-col justify-center' style={{ flex: 1 }}>
            <View className='flex flex-row items-center justify-center space-x-3'>
              <NestLight size={adjust(40)} rounded={true} />
              <View className='flex flex-col items-center justify-center'>
                <Text className='text-primary text-2xl font-medium'>
                  {localization.nestWallet[language]}
                </Text>
              </View>
            </View>
          </View>
          <View
            className='bg-card flex flex-col rounded-t-3xl px-4'
            style={{ flex: 5, paddingBottom: bottom }}
          >
            <View className='mt-4 flex flex-col space-y-4'>
              <Text className='text-text-secondary text-center text-sm font-normal'>
                {localization.tradeCryptoInStyle[language]}
              </Text>
              <Form className='flex flex-col space-y-4' formik={formik}>
                <TextInput
                  errorText={
                    formik.touched.email ? formik.errors.email : undefined
                  }
                  inputProps={{
                    id: 'email',
                    placeholder: localization.emailPlaceholder[language],
                    onChangeText: (text: string) =>
                      formik.handleChange('email')(text.trim()),
                    autoCapitalize: 'none',
                    autoComplete: 'email',
                    inputMode: 'email',
                    keyboardType: 'email-address',
                    textContentType: 'emailAddress',
                    editable: !formik.isSubmitting,
                    value: formik.values.email,
                    onSubmitEditing: formik.submitForm,
                  }}
                  filled={true}
                  startAdornment={
                    <View className='flex items-center justify-center pl-3'>
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        size={adjust(16, 2)}
                        color={colors.textSecondary}
                      />
                    </View>
                  }
                />
                <TextButton
                  onPress={formik.submitForm}
                  loading={formik.isSubmitting}
                  disabled={formik.isSubmitting || !formik.values.email}
                  disabledColor={colors.cardHighlight}
                  text={localization.continue[language]}
                />
              </Form>
            </View>
            <View className='mt-4 flex flex-row items-center'>
              <View className='bg-card-highlight-secondary h-[1px] flex-1' />
              <View className='px-4'>
                <Text className='text-text-secondary text-sm font-normal'>
                  {localization.or[language]}
                </Text>
              </View>
              <View className='bg-card-highlight-secondary h-[1px] flex-1' />
            </View>
            <View className='mt-4'>
              <BaseButton
                onPress={handlePrivateSignIn}
                disabled={formik.isSubmitting || loading}
              >
                <View className='bg-card-highlight flex flex-row items-center justify-between rounded-2xl px-4 py-4'>
                  <View className='flex flex-row items-center space-x-3'>
                    <View
                      className='bg-incognito/20 items-center justify-center rounded-full'
                      style={withSize(adjust(36))}
                    >
                      <FontAwesomeIcon
                        icon={faLaptopMobile}
                        size={adjust(20)}
                        color={colors.incognito}
                      />
                    </View>
                    <View className='flex flex-1 flex-col'>
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.continueWithDevice[language]}
                      </Text>
                      <Text className='text-text-secondary text-xs font-normal'>
                        {localization.signInPrivately[language]}
                      </Text>
                    </View>
                  </View>
                  {loading && (
                    <ActivityIndicator
                      size={adjust(24)}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
              </BaseButton>
            </View>
          </View>
        </View>
      </ViewWithInset>
    </View>
  );
}
