import { faEnvelope } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Platform } from 'react-native';
import {
  GenerateSignInCodeInput,
  SignInInput,
} from '../../../common/api/nestwallet/types';
import { delay } from '../../../common/api/utils';
import { Tuple } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { InlineErrorTooltip } from '../../../components/input-error';
import { Text } from '../../../components/text';
import { CodeInput } from '../../../components/text-input/code';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface FormikSignInInput extends Omit<SignInInput, 'oneTimeCode'> {
  oneTimeCode: Tuple<string, 6>;
}

interface CodeScreenProps {
  email: string;
  onRefreshSignInCode: (input: GenerateSignInCodeInput) => Promise<void>;
  onSubmit: (value: SignInInput) => Promise<void>;
}

export function CodeScreen(props: CodeScreenProps) {
  const { email, onRefreshSignInCode, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();
  const [refreshable, setRefreshable] = useState(true);

  const handleCodeChange = (text: Tuple<string, 6>) => {
    formik.setFieldValue(
      'oneTimeCode',
      text.map((t) => t.toUpperCase()),
    );
  };

  const handleRefreshCode = async () => {
    try {
      setRefreshable(false);
      await onRefreshSignInCode({ email });
      // Delay to make disabled time not feel too short and syncs up snackbar appearance
      await delay(80);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.resentCodeMessage[language],
      });
    } catch (err) {
      const error = parseError(
        err,
        localization.resentCodeErrorMessage[language],
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setRefreshable(true);
    }
  };

  const handleSubmit = async (value: FormikSignInInput) => {
    try {
      await onSubmit({
        ...value,
        oneTimeCode: value.oneTimeCode.join(''),
      });
    } catch (err) {
      const error = parseError(
        err,
        localization.incorrectCodeMessage[language],
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const validate = (value: FormikSignInInput) => {
    const code = value.oneTimeCode.join('');
    const isValid = code.length === 6 && /^[0-9a-zA-Z]+$/.test(code);
    return isValid
      ? undefined
      : { oneTimeCode: localization.invalidCodeMessage[language] };
  };

  const formik = useFormik<FormikSignInInput>({
    initialValues: {
      isMobile: Platform.OS !== 'web',
      email,
      oneTimeCode: ['', '', '', '', '', ''],
    },
    validate,
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
              <View
                className='bg-primary/10 items-center justify-center rounded-full'
                style={withSize(adjust(40))}
              >
                <FontAwesomeIcon
                  icon={faEnvelope}
                  size={adjust(24)}
                  color={colors.primary}
                />
              </View>
              <View className='flex flex-col items-center justify-center'>
                <Text className='text-primary text-2xl font-medium'>
                  {localization.verifyCode[language]}
                </Text>
              </View>
            </View>
          </View>
          <View
            className='bg-card flex flex-col justify-between rounded-t-3xl px-4'
            style={{ flex: 5, paddingBottom: bottom }}
          >
            <View className='mt-4 flex flex-col'>
              <Text className='text-text-primary text-center text-sm font-medium'>
                <Text className='text-text-secondary text-sm font-normal'>
                  {localization.codeWasSentTo[language]}
                </Text>
                <Text className='text-text-primary text-sm font-medium'>
                  {email}
                </Text>
              </Text>
              <View className='mt-4 flex w-full flex-row justify-center'>
                <CodeInput
                  length={6}
                  text={formik.values.oneTimeCode}
                  onChange={handleCodeChange}
                />
              </View>
              {formik.touched.oneTimeCode &&
                !!formik.errors.oneTimeCode &&
                typeof formik.errors.oneTimeCode === 'string' && (
                  <View className='mt-2 flex w-full flex-row items-center'>
                    <InlineErrorTooltip
                      errorText={formik.errors.oneTimeCode}
                      isEnabled={true}
                    />
                  </View>
                )}
              <View className='mt-4 flex flex-col'>
                <TextButton
                  onPress={formik.submitForm}
                  loading={formik.isSubmitting}
                  disabled={
                    formik.isSubmitting ||
                    formik.values.oneTimeCode.some((c) => c === '')
                  }
                  disabledColor={colors.cardHighlight}
                  text={localization.login[language]}
                />
              </View>
            </View>
            <View className='flex flex-row items-center justify-center space-x-1'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.didNotReceiveCode[language]}
              </Text>
              <Text
                className={cn('text-sm font-medium underline', {
                  'text-primary': refreshable,
                  'text-text-secondary': !refreshable,
                })}
                disabled={!refreshable || formik.isSubmitting}
                onPress={handleRefreshCode}
              >
                {localization.resend[language]}
              </Text>
            </View>
          </View>
        </View>
      </ViewWithInset>
    </View>
  );
}
