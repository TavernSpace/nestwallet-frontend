import { faEnvelope } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { UpdateEmailCodeInput } from '../../../common/api/nestwallet/types';
import { adjust } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { IUser } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { useNestWallet } from '../../../provider/nestwallet';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createUpdateEmailSchema } from './schema';

export function UpdateEmailScreen(props: {
  user: IUser;
  onSubmit: (email: string) => void;
}) {
  const { user, onSubmit } = props;
  const { apiClient } = useNestWallet();
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (input: UpdateEmailCodeInput) => {
    try {
      await apiClient.updateEmailCode(input).catch((err) => {
        const error = parseError(err);
        if (
          error.message !== 'Too many codes sent, please wait before retrying'
        ) {
          throw err;
        }
      });
      onSubmit(input.email);
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

  const formik = useFormik<UpdateEmailCodeInput>({
    initialValues: {
      email: '',
    },
    validationSchema: createUpdateEmailSchema(user.email ?? null, language),
    onSubmit: handleSubmit,
  });

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full w-full flex-col justify-between px-4'>
        <View className='mt-2 flex flex-col space-y-4'>
          <View className='w-full items-center justify-center'>
            <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faEnvelope}
                size={48}
                color={colors.primary}
              />
            </View>
          </View>
          <Text className='text-text-secondary text-sm font-normal'>
            {user.email
              ? localization.editEmail[language]
              : localization.addEmail[language]}
          </Text>

          <View className='space-y-2'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.email[language]}
            </Text>
            <TextInput
              errorText={formik.touched.email ? formik.errors.email : undefined}
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
                value: formik.values.email,
                onSubmitEditing: formik.submitForm,
              }}
              startAdornment={
                <View className='pl-3'>
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    size={adjust(16, 2)}
                    color={colors.textSecondary}
                  />
                </View>
              }
            />
          </View>
        </View>
        <TextButton
          onPress={formik.submitForm}
          loading={formik.isSubmitting}
          disabled={formik.isSubmitting || formik.values.email === ''}
          text={localization.continue[language]}
        />
      </View>
    </ViewWithInset>
  );
}
