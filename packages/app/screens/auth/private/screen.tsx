import { faLaptopMobile, faUser } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { NameInput } from '../../add-wallet/choose-name/screen';
import { NameSectionSchema } from '../schema';
import { localization } from './localization';

interface PrivateScreenProps {
  onGenerateToken: (name: string) => Promise<void>;
}

export function PrivateScreen(props: PrivateScreenProps) {
  const { onGenerateToken } = props;
  const { showSnackbar } = useSnackbar();
  const { bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();

  const handleSubmit = async (input: NameInput) => {
    try {
      await onGenerateToken(input.name);
    } catch (err) {
      const error = parseError(
        err,
        localization.errorCreatingAccount[language],
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<NameInput>({
    initialValues: {
      name: '',
    },
    validationSchema: NameSectionSchema,
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
                  icon={faLaptopMobile}
                  size={adjust(24)}
                  color={colors.primary}
                />
              </View>
              <View className='flex flex-col items-center justify-center '>
                <Text className='text-primary text-2xl font-medium'>
                  {localization.createAccount[language]}
                </Text>
              </View>
            </View>
          </View>
          <View
            className='bg-card flex flex-col justify-between rounded-t-3xl px-4'
            style={{ flex: 5, paddingBottom: bottom }}
          >
            <View className='mt-4 flex flex-col space-y-4'>
              <Text className='text-text-secondary text-center text-sm font-normal'>
                {localization.privateNoEmailAccount[language]}
              </Text>
              <Form className='flex flex-col space-y-4' formik={formik}>
                <TextInput
                  errorText={
                    formik.touched.name ? formik.errors.name : undefined
                  }
                  inputProps={{
                    id: 'name',
                    placeholder: localization.usernamePlaceholder[language],
                    onChangeText: (text: string) =>
                      formik.handleChange('name')(text.trim()),
                    autoCapitalize: 'none',
                    autoComplete: 'email',
                    inputMode: 'email',
                    keyboardType: 'email-address',
                    textContentType: 'emailAddress',
                    value: formik.values.name,
                    onSubmitEditing: formik.submitForm,
                  }}
                  filled={true}
                  startAdornment={
                    <View className='flex items-center justify-center pl-3'>
                      <FontAwesomeIcon
                        icon={faUser}
                        size={adjust(16, 2)}
                        color={colors.textSecondary}
                      />
                    </View>
                  }
                />
                <TextButton
                  onPress={formik.submitForm}
                  loading={formik.isSubmitting}
                  disabled={formik.isSubmitting}
                  text={localization.continue[language]}
                />
              </Form>
            </View>
            <View className='bg-card-highlight rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.creatingPrivateAccountInfo[language]}
              </Text>
            </View>
          </View>
        </View>
      </ViewWithInset>
    </View>
  );
}
