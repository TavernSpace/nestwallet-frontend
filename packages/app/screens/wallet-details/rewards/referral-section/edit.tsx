import { faTicket } from '@fortawesome/pro-solid-svg-icons';
import { parseError } from '@nestwallet/app/features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Platform } from 'react-native';
import { TextButton } from '../../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Form } from '../../../../components/form';
import { ScrollView } from '../../../../components/scroll';
import { Text } from '../../../../components/text';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { colors } from '../../../../design/constants';
import { IUser } from '../../../../graphql/client/generated/graphql';
import { IReferralCodeSchema } from './schema';

export function ReferralCodeUpdateScreen(props: {
  user: IUser;
  onUpdateReferralCode: (referralCode: string) => Promise<void>;
  onCancel: VoidFunction;
}) {
  const { user, onUpdateReferralCode, onCancel } = props;
  const { showSnackbar } = useSnackbar();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateReferral = async (values: { referralCode: string }) => {
    try {
      setIsSubmitting(true);
      await onUpdateReferralCode(values.referralCode);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Referral code updated successfully!',
      });
    } catch (err) {
      const appError = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: appError.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      referralCode: user.referralCode || generateRandomCode(),
    },
    validationSchema: IReferralCodeSchema,
    onSubmit: handleUpdateReferral,
  });

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <Form
        className='flex h-full flex-col justify-between px-4'
        formik={formik}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={
            Platform.OS === 'web' ? undefined : 'handled'
          }
        >
          <View className='mt-2 flex flex-col'>
            <View className='flex flex-row items-center justify-center pb-2'>
              <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
                <FontAwesomeIcon
                  icon={faTicket}
                  color={colors.primary}
                  size={48}
                  transform={{ rotate: 315 }}
                />
              </View>
            </View>
            <Text className='text-text-secondary mt-2 text-sm font-normal'>
              Give your account a custom referral code. You can always change
              this later.
            </Text>
            <View className='mt-6 space-y-4'>
              <TextInput
                errorText={
                  formik.touched.referralCode
                    ? formik.errors.referralCode
                    : undefined
                }
                inputProps={{
                  id: 'referralCode',
                  placeholder: 'Enter your referral code',
                  onChangeText: (text) => {
                    const uppercasedText = text.toUpperCase();
                    formik.setFieldValue('referralCode', uppercasedText);
                  },
                  value: formik.values.referralCode,
                  onBlur: formik.handleBlur('referralCode'),
                }}
              />
              <View className='flex flex-col space-y-2'>
                <Text className='text-text-secondary mt-2 text-sm font-normal'>
                  Your Link:
                </Text>
                <View className='bg-card rounded-2xl px-4 py-3'>
                  <Text
                    className='text-text-secondary truncate text-sm font-normal'
                    numberOfLines={1}
                  >
                    {`nestwallet.xyz/?referral=${formik.values.referralCode}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <View className='flex flex-col space-y-4'>
          <View className='bg-card rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {`If you already have a referral code changing it won't affect people you've already referred, but people will be unable to join using your old referral link.`}
            </Text>
          </View>
          <View className='flex flex-row space-x-4'>
            <View className='flex-1'>
              <TextButton type='tertiary' text='Cancel' onPress={onCancel} />
            </View>
            <View className='flex-1'>
              <TextButton
                onPress={formik.submitForm}
                loading={isSubmitting}
                disabled={isSubmitting || !!formik.errors.referralCode}
                text='Confirm'
              />
            </View>
          </View>
        </View>
      </Form>
    </ViewWithInset>
  );
}

function generateRandomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  // generate a random referral code between 5 and 8 characters
  for (let i = 0; i < Math.floor(Math.random() * 3 + 5); i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}
