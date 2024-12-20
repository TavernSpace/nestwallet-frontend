import { useFormik } from 'formik';
import { useState } from 'react';
import ChangePassword from '../../../assets/images/change-password.svg';
import { TextButton } from '../../../components/button/text-button';
import { Svg } from '../../../components/svg';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { PasswordResetSheet } from '../../lock/reset/sheet';
import { localization } from './localization';
import { createPasswordSchema } from './schema';

interface ChangePasswordInput {
  password: string;
}

interface ChangePasswordScreenProps {
  onSubmit: VoidFunction;
  onUnlock: (password: string) => Promise<void>;
}

export function ChangePasswordScreen(props: ChangePasswordScreenProps) {
  const { onSubmit, onUnlock } = props;
  const { language } = useLanguageContext();

  const [showResetSheet, setShowResetSheet] = useState(false);

  const handleSubmit = async (values: ChangePasswordInput) => {
    try {
      await onUnlock(values.password);
      onSubmit();
    } catch (error) {
      formik.setFieldError(
        'password',
        localization.incorrectPassword[language],
      );
    }
  };

  const formik = useFormik<ChangePasswordInput>({
    initialValues: {
      password: '',
    },
    validationSchema: createPasswordSchema(language),
    onSubmit: handleSubmit,
  });

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='mt-4 flex w-full flex-col space-y-4'>
          <View className='items-center justify-center py-2'>
            <Svg source={ChangePassword} width={88} height={72} />
          </View>
          <Text className='text-text-secondary text-left text-sm font-normal'>
            {localization.toChangeYourPassword[language]}
          </Text>
          <View className='flex flex-col space-y-2'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.currentPassword[language]}
            </Text>
            <TextInput
              errorText={
                formik.touched.password ? formik.errors.password : undefined
              }
              inputProps={{
                id: 'password',
                placeholder: localization.enterYourPassword[language],
                onChange: formik.handleChange,
                onBlur: formik.handleBlur,
                value: formik.values.password,
                autoComplete: 'off',
                secureTextEntry: true,
                onSubmitEditing: formik.submitForm,
              }}
            />
            <View className='flex flex-row items-center justify-center space-x-1'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.forgotYourPassword[language]}
              </Text>
              <TextButton
                type='transparent'
                text={localization.reset[language]}
                rippleEnabled={false}
                textStyle={{
                  paddingVertical: 0,
                  fontSize: 14,
                  textDecorationLine: 'underline',
                  color: colors.primary,
                }}
                onPress={() => setShowResetSheet(true)}
                tabIndex={-1}
              />
            </View>
          </View>
        </View>
        <TextButton
          text={localization.changePassword[language]}
          onPress={formik.submitForm}
        />
        <PasswordResetSheet
          isShowing={showResetSheet}
          onClose={() => setShowResetSheet(false)}
          onSubmit={() => {
            setShowResetSheet(false);
            onSubmit();
          }}
        />
      </View>
    </ViewWithInset>
  );
}
