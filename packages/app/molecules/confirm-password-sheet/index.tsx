import { useFormik } from 'formik';
import { Platform } from 'react-native';
import { SignatureType } from '../../common/types';
import { TextButton } from '../../components/button/text-button';
import { Form } from '../../components/form';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { PasswordInput } from '../../components/text-input/password';
import { View } from '../../components/view';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { SecretType } from '../../screens/signer/reveal-key/types';
import { IPasswordSchema } from './schema';

interface IPasswordInput {
  password: string;
}

export function ConfirmPasswordSheetContent(props: {
  type: SignatureType | SecretType;
  onClose: VoidFunction;
  onSubmit: (password: string) => Promise<void>;
}) {
  const { type, onClose, onSubmit } = props;
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (value: IPasswordInput) => {
    try {
      await onSubmit(value.password);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Incorrect password',
      });
    }
  };

  const formik = useFormik<IPasswordInput>({
    initialValues: {
      password: '',
    },
    validationSchema: IPasswordSchema,
    onSubmit: handleSubmit,
  });

  const isReveal = type === 'seed' || type === 'pk';

  return (
    <Form formik={formik}>
      <ActionSheetHeader
        title={'Confirm Password'}
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {(Platform.OS === 'ios' || Platform.OS === 'android') &&
            'Device biometrics modified. '}
          {isReveal
            ? `Confirm your password to view your ${
                type === 'seed' ? 'seed phrase' : 'private key'
              }`
            : `Confirm your password to sign the ${type}`}
        </Text>
        <PasswordInput
          className='mt-2 w-full'
          password={formik.values.password}
          onPasswordChange={formik.handleChange('password')}
          onSubmit={formik.submitForm}
        />
        <View className='mt-6'>
          <TextButton
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
            text='Confirm'
          />
        </View>
      </View>
    </Form>
  );
}
