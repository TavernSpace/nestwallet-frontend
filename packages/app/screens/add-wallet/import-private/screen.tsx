import { useFormik } from 'formik';
import { TextButton } from '../../../components/button/text-button';
import { Form } from '../../../components/form';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { getPrivateKeySchema, maxLengths } from './schema';

export function ImportPrivateKeyScreen(props: {
  blockchain: IBlockchainType;
  onSubmit: (privateKey: string) => Promise<void>;
}) {
  const { blockchain, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();
  const maxLength = maxLengths[blockchain];

  const handleSubmit = async (input: { key: string }) => {
    try {
      await onSubmit(input.key);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: (err as Error).message ?? localization.defaultError[language],
      });
    }
  };

  const handlePrivateKeyChange = (key: string) => {
    formik.handleChange('key')(key.trim().slice(0, maxLength));
  };

  const formik = useFormik<{ key: string }>({
    initialValues: {
      key: '',
    },
    onSubmit: handleSubmit,
    validationSchema: getPrivateKeySchema(blockchain, language),
  });

  const lengthText = onBlockchain(blockchain)(
    () => maxLength.toString(),
    () => `${maxLength - 1}-${maxLength}`,
    () => maxLength.toString(),
  );

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <Form
          className='flex h-full w-full flex-col justify-between'
          formik={formik}
        >
          <View className='flex flex-col space-y-2 px-4'>
            <View className='mt-4'>
              <TextInput
                errorText={formik.touched.key ? formik.errors.key : undefined}
                inputProps={{
                  id: 'key',
                  placeholder: localization.placeHolder(lengthText)[language],
                  textAlignVertical: 'top',
                  onChangeText: handlePrivateKeyChange,
                  multiline: true,
                  numberOfLines: 5,
                  maxLength: maxLengths[blockchain],
                  value: formik.values.key,
                  spellCheck: false,
                  style: { minHeight: 100, textAlignVertical: 'top' },
                  autoComplete: 'off',
                }}
              />
            </View>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {
                  localization.privateKeyRules(
                    lengthText,
                    onBlockchain(blockchain)(
                      () => localization.anEthereum[language],
                      () => localization.aSolana[language],
                      () => localization.aTON[language],
                    ),
                    onBlockchain(blockchain)(
                      () => localization.lowercaseHex[language],
                      () => localization.base58String[language],
                      () => localization.lowercaseHex[language],
                    ),
                  )[language]
                }
              </Text>
            </View>
          </View>
          <View className='mt-2 flex flex-col space-y-2 px-4'>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.encryptedKeysMessage[language]}
              </Text>
            </View>
            <TextButton
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting || formik.values.key.length === 0}
              onPress={formik.submitForm}
              text={localization.import[language]}
            />
          </View>
        </Form>
      </ViewWithInset>
    </View>
  );
}
