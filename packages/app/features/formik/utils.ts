import { FormikValues, useFormik } from 'formik';
import { TextInputProps } from 'react-native';

export function getTextInputProps<T extends FormikValues>(
  formik: ReturnType<typeof useFormik<T>>,
  variable: string,
  overrides?: Partial<TextInputProps>,
): TextInputProps {
  return {
    id: variable,
    onChangeText: formik.handleChange(variable),
    onSubmitEditing: formik.submitForm,
    value: formik.values[variable],
    ...overrides,
  };
}
