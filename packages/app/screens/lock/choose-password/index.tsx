// TODO: should code split this
import { faLock } from '@fortawesome/pro-solid-svg-icons';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import cn from 'classnames';
import { useFormik } from 'formik';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { PasswordInput } from '../../../components/text-input/password';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createIPasswordSchema } from './schema';

interface IPasswordInput {
  password: string;
  confirmPassword: string;
  score: number;
}

interface ChoosePasswordSheetProps {
  paddingTop: number;
  onSubmit: (password: string) => Promise<unknown>;
}

export function ChoosePasswordScreen(props: ChoosePasswordSheetProps) {
  const { paddingTop, onSubmit } = props;
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
      const error = parseError(
        err,
        localization.errorChangingPassword[language],
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
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
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      <View className='bg-background flex h-full w-full flex-col justify-between px-4'>
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View className='flex flex-1 flex-col justify-between'>
            <View className='flex flex-col'>
              <View className='flex flex-col items-center justify-center pt-2'>
                <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
                  <FontAwesomeIcon
                    icon={faLock}
                    color={colors.primary}
                    size={48}
                  />
                </View>
                <View className='flex flex-col space-y-2 pt-4'>
                  <Text className='text-text-secondary text-center text-sm font-normal'>
                    {localization.passwordUsedToEncryptMessage[language]}
                  </Text>
                </View>
              </View>
              <View className='mt-2 w-full space-y-2'>
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
            <View className='bg-card mt-2 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary items-center text-xs font-normal'>
                {localization.cannotRecoverPasswordMessage[language]}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View className='mt-4'>
          <TextButton
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
            text={localization.continue[language]}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}

export const PasswordStrengthBar = styled(function (props: {
  score?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { score = -1, style } = props;
  const { language } = useLanguageContext();
  return (
    <View className='flex flex-row items-center space-x-2 px-2' style={style}>
      <View className='flex flex-row items-end space-x-0.5'>
        <View
          className={cn('w-1 rounded-sm', {
            'bg-card-highlight': score === -1,
            'bg-failure': score === 0 || score === 1,
            'bg-primary': score === 2,
            'bg-success': score >= 3,
          })}
          style={{ height: 6 }}
        />
        <View
          className={cn('w-1 rounded-sm ', {
            'bg-card-highlight': score <= 1,
            'bg-primary': score === 2,
            'bg-success': score >= 3,
          })}
          style={{ height: 9 }}
        />
        <View
          className={cn('w-1 rounded-sm', {
            'bg-card-highlight': score <= 2,
            'bg-success': score >= 3,
          })}
          style={{ height: 12 }}
        />
      </View>
      <View>
        <Text
          className={cn('text-xs font-medium', {
            'text-text-secondary': score === -1,
            'text-failure': score === 0 || score === 1,
            'text-primary': score === 2,
            'text-success': score >= 3,
          })}
        >
          {score < 0
            ? localization.passwordStrength[language]
            : score <= 1
            ? localization.weakPassword[language]
            : score <= 2
            ? localization.moderatePassword[language]
            : localization.strongPassword[language]}
        </Text>
      </View>
    </View>
  );
});
