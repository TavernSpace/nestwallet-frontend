import { useFormik } from 'formik';
import _ from 'lodash';
import { Alert } from '../../../../components/alert';
import { Form } from '../../../../components/form';
import { Text } from '../../../../components/text';
import { TextInput } from '../../../../components/text-input';
import { useLanguageContext } from '../../../../provider/language';
import { EditNonceSchema } from '../../schema';
import { localization } from './localization';

interface EditSafeNonceInput {
  nonce: number;
}

export function EditSafeNonceSheet(props: {
  safeNonce: number;
  latestNonce: number;
  savedNonce?: number;
  onCancel: VoidFunction;
  onConfirm: (nonce: number) => Promise<unknown>;
  isVisible: boolean;
}) {
  const { safeNonce, latestNonce, savedNonce, onCancel, onConfirm, isVisible } =
    props;
  const { language } = useLanguageContext();

  const handleConfirm = async (input: EditSafeNonceInput) => {
    return onConfirm(input.nonce);
  };

  const initialNonce = !_.isNil(savedNonce)
    ? savedNonce
    : latestNonce >= safeNonce
    ? latestNonce + 1
    : safeNonce;

  const formik = useFormik<EditSafeNonceInput>({
    initialValues: {
      nonce: initialNonce,
    },
    validationSchema: EditNonceSchema(safeNonce, language),
    onSubmit: handleConfirm,
  });

  const handleNumericChange = (textSetter: (value: string) => void) => {
    return (value: string) => {
      const validNumber = value.replace(/[^0-9]/g, '');
      textSetter(validNumber);
    };
  };

  const subtitle =
    latestNonce === -1
      ? localization.nextExecutableNonce(safeNonce)[language]
      : `${localization.nextExecutableNonce(safeNonce)[language]} ${
          safeNonce > latestNonce
            ? localization.previousExecutedNonce(latestNonce)[language]
            : localization.lastPendingNonce(latestNonce)[language]
        }`;

  return (
    <Alert
      title={localization.editNonce[language]}
      subtitle={subtitle}
      onCancel={onCancel}
      onConfirm={formik.submitForm}
      isVisible={isVisible}
    >
      <Form className='mt-2' formik={formik} blur={!isVisible}>
        <Text className='text-text-primary py-2 text-xs font-bold'>
          {localization.NONCE[language]}
        </Text>
        <TextInput
          errorText={formik.touched.nonce ? formik.errors.nonce : undefined}
          inputProps={{
            id: 'edit-nonce',
            placeholder: localization.noncePlaceholder[language],
            // TODO: flicker on format in react-native https://github.com/facebook/react-native/issues/24585
            onChangeText: handleNumericChange(formik.handleChange('nonce')),
            inputMode: 'numeric',
            numberOfLines: 1,
            value: formik.values.nonce.toString(),
          }}
        />
      </Form>
    </Alert>
  );
}
