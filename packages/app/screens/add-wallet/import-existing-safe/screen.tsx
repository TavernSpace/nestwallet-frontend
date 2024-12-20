import { useFormik } from 'formik';
import { TextButton } from '../../../components/button/text-button';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { ChainInfo, safeSupportedChains } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import {
  IBlockchainType,
  IOrganization,
  IUpsertWalletInput,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { ChainSelect } from '../../../molecules/select/chain-select';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createUpsertWalletInputSchema } from './upsert-safe-schema';

export function ImportExistingSafeScreen(props: {
  onCreateWallet: (value: IUpsertWalletInput) => Promise<void>;
  organization: IOrganization;
}) {
  const { onCreateWallet, organization } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handleCreateWallet = async (value: IUpsertWalletInput) => {
    try {
      await onCreateWallet(value);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.importSuccess[language],
      });
    } catch (err) {
      const defaultError = localization.defaultError[language];
      const { message, formikError } = parseError(err, defaultError);
      formik.setErrors(formikError);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const handleAddressChange = (address: string) => {
    formik.handleChange('address')(address.trim());
  };

  const formik = useFormik<IUpsertWalletInput>({
    initialValues: {
      chainId: 0,
      name: '',
      address: '',
      blockchain: IBlockchainType.Evm,
      type: IWalletType.Safe,
      organizationId: organization.id,
      color: undefined,
    },
    validationSchema: createUpsertWalletInputSchema(language),
    onSubmit: handleCreateWallet,
  });

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <Form className='flex h-full flex-col justify-between' formik={formik}>
        <ScrollView className='px-4' showsVerticalScrollIndicator={false}>
          <View className='mt-4 space-y-1'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.name[language]}
            </Text>
            <TextInput
              errorText={formik.touched.name ? formik.errors.name : undefined}
              inputProps={{
                id: 'name',
                placeholder: localization.namePlaceholder[language],
                onChangeText: formik.handleChange('name'),
                value: formik.values.name,
              }}
            />
          </View>

          <View className='mt-4 space-y-1'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.address[language]}
            </Text>
            <TextInput
              errorText={
                formik.touched.address ? formik.errors.address : undefined
              }
              inputProps={{
                id: 'address',
                placeholder: localization.addressPlaceholder[language],
                onChangeText: handleAddressChange,
                value: formik.values.address,
              }}
            />
          </View>

          <View className='mt-4 space-y-1'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.network[language]}
            </Text>
            <ChainSelect
              errorText={
                formik.touched.chainId ? formik.errors.chainId : undefined
              }
              onChange={(chain: ChainInfo) => {
                formik.setFieldValue('chainId', chain.id);
              }}
              chains={safeSupportedChains}
              value={formik.values.chainId}
              isFullHeight={true}
              hasTopInset={false}
            />
          </View>
        </ScrollView>
        <View className='mt-4 px-4'>
          <TextButton
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
            text={localization.importWalletButtonText[language]}
          />
        </View>
      </Form>
    </ViewWithInset>
  );
}
