import { useFormik } from 'formik';
import { TextButton } from '../../../../components/button/text-button';
import { Form } from '../../../../components/form';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { parseError } from '../../../../features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { AddContactSchema } from './schema';

interface IAddContactInput {
  name: string;
}

export function AddContactSheet(props: {
  isShowing: boolean;
  defaultName?: string;
  onClose: VoidFunction;
  onSubmit: (name: string) => Promise<void>;
}) {
  const { isShowing, defaultName, onClose, onSubmit } = props;
  const { showSnackbar } = useSnackbar();

  const handleSubmitContact = async (value: IAddContactInput) => {
    try {
      await onSubmit(value.name);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Successfully added contact!',
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<IAddContactInput>({
    initialValues: {
      name: defaultName ?? '',
    },
    validationSchema: AddContactSchema,
    onSubmit: handleSubmitContact,
  });

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <Form formik={formik}>
        <ActionSheetHeader
          title='Add Contact'
          onClose={onClose}
          type='detached'
        />
        <View className='flex flex-col px-4'>
          <View className='space-y-1'>
            <Text className='text-text-primary text-sm font-medium'>Name</Text>
            <TextInput
              errorText={formik.touched.name ? formik.errors.name : undefined}
              inputProps={{
                id: 'name',
                placeholder: 'Ex: Work Wallet',
                onChangeText: formik.handleChange('name'),
                value: formik.values.name,
              }}
            />
          </View>
          <View className='mt-4'>
            <TextButton
              onPress={formik.submitForm}
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting}
              text='Confirm'
            />
          </View>
        </View>
      </Form>
    </ActionSheet>
  );
}
