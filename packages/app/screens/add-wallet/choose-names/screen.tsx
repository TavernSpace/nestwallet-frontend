import { useFormik } from 'formik';
import { ScrollView } from 'react-native';
import { formatAddress } from '../../../common/format/address';
import { convertWalletTypeToLabel } from '../../../common/utils/types';
import { TextButton } from '../../../components/button/text-button';
import { Form } from '../../../components/form';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { parseError } from '../../../features/errors';
import {
  IUpsertWalletInput,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createChooseNamesSchema } from './schema';

export function ChooseNamesScreen(props: {
  inputs: IUpsertWalletInput[];
  walletType: IWalletType;
  onSubmit: (inputs: IUpsertWalletInput[]) => Promise<unknown>;
}) {
  const { inputs, walletType, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handleSubmit = async (inputs: IUpsertWalletInput[]) => {
    try {
      await onSubmit(inputs);
    } catch (err) {
      const error = parseError(err, localization.defaultError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<IUpsertWalletInput[]>({
    initialValues: inputs,
    onSubmit: handleSubmit,
    validationSchema: createChooseNamesSchema(language),
  });

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <Form
          className='flex h-full flex-col justify-between px-4'
          formik={formik}
        >
          <View className='flex-1'>
            <View className='mt-4 flex-1'>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className='space-y-3'>
                  {inputs.map((input, index) => (
                    <View className='flex flex-col space-y-2' key={index}>
                      <Text>
                        <Text className='text-text-primary text-sm font-medium'>
                          {`${localization.walletNumber[language]}${
                            index + 1
                          }  `}
                        </Text>
                        <Text className='text-text-secondary text-sm font-normal'>{`${formatAddress(
                          input.address,
                        )}`}</Text>
                      </Text>
                      <TextInput
                        className='mt-2'
                        errorText={
                          formik.touched[index]?.name
                            ? formik.errors[index]?.name
                            : undefined
                        }
                        inputProps={{
                          placeholder: `${localization.walletNumber[language]}${
                            index + 1
                          } ${
                            localization.from[language]
                          } ${convertWalletTypeToLabel(walletType)} `,
                          onChangeText: (name) => {
                            formik.values[index]!.name = name;
                            formik.setValues(formik.values);
                          },
                          value: formik.values[index]?.name,
                        }}
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          <View className='mt-4'>
            <TextButton
              onPress={formik.submitForm}
              text={localization.complete[language]}
              disabled={formik.isSubmitting}
              loading={formik.isSubmitting}
            />
          </View>
        </Form>
      </ViewWithInset>
    </View>
  );
}
