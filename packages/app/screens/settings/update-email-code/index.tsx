import { faEnvelope } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useFormik } from 'formik';
import { useState } from 'react';
import {
  UpdateEmailCodeInput,
  UpdateEmailVerifyInput,
} from '../../../common/api/nestwallet/types';
import { delay } from '../../../common/api/utils';
import { Tuple } from '../../../common/types';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { CodeInput } from '../../../components/text-input/code';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { IUser } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface FormikUpdateEmailInput {
  oneTimeCode: Tuple<string, 6>;
}

export function UpdateEmailCodeScreen(props: {
  user: IUser;
  email: string;
  onRefreshCode: (input: UpdateEmailCodeInput) => Promise<void>;
  onSubmit: (value: UpdateEmailVerifyInput) => Promise<void>;
}) {
  const { user, email, onRefreshCode, onSubmit } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [refreshable, setRefreshable] = useState(true);

  const handleRefreshCode = async () => {
    try {
      setRefreshable(false);
      await onRefreshCode({ email });
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

  const handleSubmit = async (value: FormikUpdateEmailInput) => {
    try {
      await onSubmit({
        email,
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

  const validate = (value: FormikUpdateEmailInput) => {
    const code = value.oneTimeCode.join('');
    const isValid = code.length === 6 && /^[0-9a-zA-Z]+$/.test(code);
    return isValid
      ? undefined
      : { oneTimeCode: localization.invalidCodeMessage[language] };
  };

  const formik = useFormik<FormikUpdateEmailInput>({
    initialValues: {
      oneTimeCode: ['', '', '', '', '', ''],
    },
    validate,
    onSubmit: handleSubmit,
  });

  const handleCodeChange = (text: Tuple<string, 6>) => {
    formik.setFieldValue(
      'oneTimeCode',
      text.map((char) => char.toUpperCase()),
    );
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='flex flex-col space-y-4'>
          <View className='mt-2 w-full items-center justify-center'>
            <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faEnvelope}
                size={48}
                color={colors.primary}
              />
            </View>
          </View>
          <Text className='text-text-secondary text-center text-sm font-normal'>
            <Text className='text-text-primary font-medium'>{email}</Text>
            {localization.codeWasSentTo[language]}
          </Text>
          <View>
            <CodeInput
              length={6}
              text={formik.values.oneTimeCode}
              onChange={handleCodeChange}
            />
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
        <TextButton
          onPress={formik.submitForm}
          loading={formik.isSubmitting}
          disabled={
            formik.isSubmitting ||
            formik.values.oneTimeCode.some((value) => value === '')
          }
          text={localization.verify[language]}
        />
      </View>
    </ViewWithInset>
  );
}
