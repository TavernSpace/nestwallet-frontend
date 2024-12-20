import { useFormik } from 'formik';
import { ReactNativeFile } from '../../../common/hooks/graphql';
import { TextButton } from '../../../components/button/text-button';
import { FileInput } from '../../../components/file-input/default';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import {
  IFile,
  IUpdateUserProfileInput,
  IUser,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { deletionUUID } from '../../wallet/edit-wallet/screen';
import { localization } from './localization';
import { EditProfileSchema } from './schema';

export function EditProfileScreen(props: {
  user: IUser;
  onUpdateEmail: VoidFunction;
  onSubmit: (value: IUpdateUserProfileInput) => Promise<void>;
}) {
  const { user, onUpdateEmail, onSubmit } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const handleOnSubmit = async (value: IUpdateUserProfileInput) => {
    try {
      await onSubmit(value);
      if (user.name) {
        showSnackbar({
          severity: ShowSnackbarSeverity.success,
          message: localization.successfullyUpdatedProfile[language],
        });
      }
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorUpdatingProfile[language],
      });
    }
  };

  const handleFileChange = (value: File | ReactNativeFile) => {
    // handles problematic image types
    if (value.type === 'image/svg+xml' || value.type === 'image/tiff') {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message:
          value.type === 'image/svg+xml'
            ? localization.svgFilesNotSupported[language]
            : localization.tiffFilesNotSupported[language],
      });
    } else {
      formik.setFieldValue('profilePictureUpload', value);
      formik.setFieldValue('profilePicture', undefined);
    }
  };

  const formik = useFormik<IUpdateUserProfileInput>({
    initialValues: {
      name: user?.name ?? '',
      avatar: '',
      profilePicture: undefined,
      profilePictureUpload: undefined,
    },
    validationSchema: EditProfileSchema,
    onSubmit: handleOnSubmit,
  });

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <Form className='flex h-full flex-col justify-between' formik={formik}>
        <ScrollView className='mt-4 px-4' showsVerticalScrollIndicator={false}>
          <View className='space-y-4'>
            <View className='flex flex-col items-center justify-center'>
              <FileInput
                title={localization.editProfilePicture[language]}
                defaultValue={user.profilePicture as IFile}
                value={formik.values.profilePictureUpload}
                onChange={(value) => handleFileChange(value)}
                onDelete={() => {
                  formik.setFieldValue('profilePictureUpload', null);
                  formik.setFieldValue('profilePicture', {
                    id: deletionUUID,
                  });
                }}
              />
            </View>

            <View className='space-y-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.username[language]}
              </Text>
              <TextInput
                errorText={formik.touched.name ? formik.errors.name : undefined}
                inputProps={{
                  id: 'name',
                  placeholder: localization.enterYourName[language],
                  onChangeText: formik.handleChange('name'),
                  value: formik.values.name,
                  onSubmitEditing: formik.submitForm,
                }}
              />
            </View>

            <View className='space-y-2'>
              {!!user.email && (
                <View className='space-y-2'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.email[language]}
                  </Text>
                  <TextInput
                    inputProps={{
                      editable: false,
                      id: 'email',
                      value: user.email,
                    }}
                  />
                </View>
              )}
              <Text
                className='text-text-secondary text-center text-sm font-normal underline'
                onPress={onUpdateEmail}
              >
                {user.email
                  ? localization.changeEmail[language]
                  : localization.registerEmail[language]}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View className='mt-4 px-4'>
          <TextButton
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
            text={localization.complete[language]}
          />
        </View>
      </Form>
    </ViewWithInset>
  );
}
