import { faVault } from '@fortawesome/pro-solid-svg-icons';
import { SafeCreationInfoResponse } from '@safe-global/api-kit';
import { useFormik } from 'formik';
import { Loadable } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { ChainInfo, safeSupportedChains } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import {
  safeProxyAddressToVersion,
  validChainsForSafeProxyFactory,
} from '../../../features/safe/deployment';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { ChainSelect } from '../../../molecules/select/chain-select';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from '../localization';
import { MultichainDeployInput, createMultiDeployChainSchema } from '../schema';

interface MultichainDeployChainScreenProps {
  wallet: IWallet;
  safeCreationInfo: Loadable<SafeCreationInfoResponse>;
  onSubmit: (
    input: MultichainDeployInput,
    creationInfo: SafeCreationInfoResponse,
  ) => Promise<void>;
}

export function MultichainDeployScreen(
  props: MultichainDeployChainScreenProps,
) {
  const { wallet, safeCreationInfo, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handleSubmit = async (input: MultichainDeployInput) => {
    try {
      if (safeCreationInfo.success) {
        await onSubmit(input, safeCreationInfo.data);
      }
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<MultichainDeployInput>({
    initialValues: {
      chainId: 0,
      name: wallet.name,
      color: undefined,
    },
    validationSchema: createMultiDeployChainSchema(language),
    onSubmit: handleSubmit,
  });

  return onLoadable(safeCreationInfo)(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetSafeInfo[language]}
        description={localization.unableToGetSafeInfoDescription[language]}
      />
    ),
    (safeCreationInfo) => {
      const originalVersion = safeProxyAddressToVersion(
        safeCreationInfo.factoryAddress,
      );
      const isSupportedVersion = originalVersion === '1.3.0';
      const factoryChains = validChainsForSafeProxyFactory(
        safeCreationInfo.factoryAddress,
      );
      const validChains = safeSupportedChains.filter(
        (chain) => factoryChains.has(chain.id) && chain.id !== wallet.chainId,
      );
      return validChains.length > 0 && isSupportedVersion ? (
        <ViewWithInset
          className='h-full w-full'
          hasBottomInset={true}
          shouldAvoidKeyboard={true}
        >
          <Form
            className='flex flex-1 flex-col justify-between space-y-8 px-4'
            formik={formik}
          >
            <View>
              <View className='space-y-4'>
                <View className='space-y-1'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.name[language]}
                  </Text>
                  <TextInput
                    errorText={
                      formik.touched.name ? formik.errors.name : undefined
                    }
                    inputProps={{
                      id: 'name',
                      placeholder: wallet.name,
                      onChangeText: formik.handleChange('name'),
                      value: formik.values.name,
                    }}
                  />
                </View>

                <View className='space-y-1'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.address[language]}
                  </Text>
                  <View className='bg-card border-card-highlight flex h-12 flex-row items-center justify-center rounded-xl border px-4'>
                    <Text
                      className='text-text-primary flex-1 truncate text-sm font-medium'
                      numberOfLines={1}
                    >
                      {wallet.address}
                    </Text>
                  </View>
                </View>

                <View className='space-y-1'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.network[language]}
                  </Text>
                  <ChainSelect
                    errorText={
                      formik.touched.chainId && formik.errors.chainId
                        ? localization.selectNetwork[language]
                        : undefined
                    }
                    onChange={(chain: ChainInfo) => {
                      formik.setFieldValue('chainId', chain.id);
                    }}
                    chains={validChains}
                    value={formik.values.chainId}
                    isFullHeight={true}
                    hasTopInset={false}
                  />
                </View>
              </View>
            </View>
            <TextButton
              onPress={formik.submitForm}
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting}
              text={localization.next[language]}
            />
          </Form>
        </ViewWithInset>
      ) : (
        <View className='h-full w-full items-center justify-center space-y-6 px-4'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon icon={faVault} size={48} color={colors.primary} />
          </View>
          <View className='flex flex-col items-center space-y-2'>
            <Text className='text-text-primary text-center text-base font-medium'>
              {localization.notSupportedTitle[language]}
            </Text>
            <Text className='text-text-secondary text-center text-xs font-normal'>
              {localization.notSupportedDescription[language]}
            </Text>
          </View>
        </View>
      );
    },
  );
}
