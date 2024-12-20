import { styled } from 'nativewind';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PromiseFunction } from '../../common/types';
import { View } from '../view';

export interface IFormikFormProps {
  formik: {
    isSubmitting: boolean;
    submitForm: PromiseFunction<unknown>;
  };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blur?: boolean;
}

export type RNWFormProps = Pick<
  React.FormHTMLAttributes<HTMLFormElement>,
  Exclude<keyof React.FormHTMLAttributes<HTMLFormElement>, 'style'>
> & {
  style?: StyleProp<ViewStyle>;
};

export const Form = styled(function (props: IFormikFormProps) {
  const { blur } = props;
  return blur === undefined ? (
    <DefaultForm {...props} />
  ) : (
    <CustomForm {...props} blur={blur} />
  );
});

// default behaviour, remove handler on screen blur
function DefaultForm(props: Omit<IFormikFormProps, 'blur'>) {
  const { formik, children, style } = props;

  // const handleKeyboardPress = (event: KeyboardEvent) => {
  //   if (event.key === 'Enter') {
  //     formik.submitForm();
  //   }
  // };

  // useFocusEffect(
  //   React.useCallback(() => {
  //     document.addEventListener('keydown', handleKeyboardPress);
  //     return () => {
  //       document.removeEventListener('keydown', handleKeyboardPress);
  //     };
  //   }, []),
  // );

  return <View style={style}>{children}</View>;
}

// custom behaviour, disable when blur is true
function CustomForm(props: IFormikFormProps & { blur: boolean }) {
  const { formik, children, style, blur } = props;

  // const handleKeyboardPress = (event: KeyboardEvent) => {
  //   if (event.key === 'Enter') {
  //     formik.submitForm();
  //   }
  // };

  // useEffect(() => {
  //   if (!blur) {
  //     document.addEventListener('keydown', handleKeyboardPress);
  //     return () => {
  //       document.removeEventListener('keydown', handleKeyboardPress);
  //     };
  //   }
  //   return;
  // }, [blur]);

  return <View style={style}>{children}</View>;
}
