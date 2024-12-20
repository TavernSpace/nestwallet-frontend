import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { ReactNativeFile } from '../../../common/hooks/graphql';
import { useNavigationOptions } from '../../../common/hooks/navigation';
import { adjust, withSize } from '../../../common/utils/style';
import { Alert } from '../../../components/alert';
import { BaseButton } from '../../../components/button/base-button';
import { ColoredIconButton } from '../../../components/button/icon-button';
import { TextButton } from '../../../components/button/text-button';
import { ChainChip } from '../../../components/chip';
import { FileInput } from '../../../components/file-input/default';
import { Form } from '../../../components/form';
import { ScanBorder } from '../../../components/scan';
import { ScrollView } from '../../../components/scroll';
import { ActionSheet } from '../../../components/sheet';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { isEVMAddress } from '../../../features/evm/utils';
import { isSolanaAddress } from '../../../features/svm/utils';
import { isTONAddress, normalizeTONAddress } from '../../../features/tvm/utils';
import {
  IBlockchainType,
  IContact,
  IFile,
  IUpsertContactInput,
} from '../../../graphql/client/generated/graphql';
import { ScanAddressQRCode } from '../../../molecules/scan/address';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { deletionUUID } from '../../wallet/edit-wallet/screen';
import { localization } from './localization';
import { createUpsertContactInputSchema } from './schema';

interface UpsertContactScreenProps {
  contact?: IContact;
  organizationId: string;
  onSubmitContact: (value: IUpsertContactInput) => Promise<void>;
  onRemoveContact: (contact: IContact) => Promise<void>;
  onToggleLock?: (enabled: boolean) => void;
}

export function UpsertContactScreen(props: UpsertContactScreenProps) {
  const {
    contact,
    organizationId,
    onSubmitContact,
    onRemoveContact,
    onToggleLock,
  } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [showScanSheet, setShowScanSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  useNavigationOptions({
    headerRight: () =>
      contact ? (
        <ColoredIconButton
          icon={faTrash}
          onPress={() => setShowDeleteSheet(true)}
          color={colors.failure}
        />
      ) : Platform.OS !== 'web' ? (
        <BaseButton onPress={() => setShowScanSheet(true)}>
          <View
            className='items-center justify-center'
            style={withSize(adjust(16))}
          >
            <ScanBorder
              size={adjust(18, 2)}
              length={7}
              thickness={Platform.OS === 'android' ? 2 : 4}
              color={colors.textPrimary}
              radius={Platform.OS === 'android' ? 4 : 12}
            />
          </View>
        </BaseButton>
      ) : undefined,
  });

  const handleSubmitContact = async (value: IUpsertContactInput) => {
    try {
      const input = { ...value };
      if (isEVMAddress(value.address)) {
        input.address = ethers.getAddress(value.address);
        input.blockchain = IBlockchainType.Evm;
      } else if (isSolanaAddress(value.address)) {
        // solana addresses don't need normalization
        input.blockchain = IBlockchainType.Svm;
      } else if (isTONAddress(value.address)) {
        input.address = normalizeTONAddress(value.address);
        input.blockchain = IBlockchainType.Tvm;
      } else {
        throw new Error(localization.invalidAddressProvided[language]);
      }
      await onSubmitContact(input);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: contact
          ? localization.updatedContact[language]
          : localization.addedContact[language],
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleRemoveContact = async () => {
    if (!contact) return;
    try {
      await onRemoveContact(contact);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.removedContact[language],
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleFileChange = (value: File | ReactNativeFile) => {
    // handles problematic image types
    if (value.type === 'image/svg+xml' || value.type === 'image/tiff') {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message:
          value.type === 'image/svg+xml'
            ? localization.svgFilesNotSupported[language]
            : localization.tiffFilesNotSupported[language],
      });
    } else {
      formik.setFieldValue('profilePictureUpload', value);
      formik.setFieldValue('profilePicture', undefined);
    }
  };

  const formik = useFormik<IUpsertContactInput>({
    initialValues: {
      name: contact?.name ?? '',
      address: contact?.address ?? '',
      id: contact?.id,
      organizationId: contact?.organization.id || organizationId,
      profilePicture: undefined,
      profilePictureUpload: undefined,
    },
    validationSchema: createUpsertContactInputSchema(language),
    onSubmit: handleSubmitContact,
  });

  const handleCloseScanSheet = () => {
    setShowScanSheet(false);
    onToggleLock?.(true);
  };

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  const handleScanAddress = async (address: string) => {
    await formik.setFieldValue('address', address);
    setShowScanSheet(false);
  };

  return (
    <>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <Form className='flex h-full flex-col justify-between' formik={formik}>
          <ScrollView className='px-4' showsVerticalScrollIndicator={false}>
            <View className='space-y-4'>
              <View className='flex flex-col items-center justify-center'>
                <FileInput
                  title={localization.editContactImage[language]}
                  defaultValue={contact?.profilePicture as IFile}
                  value={formik.values.profilePictureUpload}
                  onChange={(value) => handleFileChange(value)}
                  onDelete={() => {
                    formik.setFieldValue('profilePictureUpload', null);
                    formik.setFieldValue('profilePicture', {
                      id: deletionUUID,
                    });
                  }}
                />
              </View>
              <View className='space-y-1'>
                <Text className='text-text-primary text-sm font-medium'>
                  {localization.contactName[language]}
                </Text>
                <TextInput
                  errorText={
                    formik.touched.name ? formik.errors.name : undefined
                  }
                  inputProps={{
                    id: 'name',
                    placeholder: localization.namePlaceholder[language],
                    onChangeText: formik.handleChange('name'),
                    value: formik.values.name,
                  }}
                />
              </View>

              <View className='space-y-1'>
                <Text className='text-text-primary text-sm font-medium'>
                  {localization.address[language]}
                </Text>
                <View className=''>
                  <TextInput
                    errorText={
                      formik.touched.address ? formik.errors.address : undefined
                    }
                    inputProps={{
                      id: 'address',
                      placeholder: localization.addressPlaceholder[language],
                      onChangeText: formik.handleChange('address'),
                      value: formik.values.address,
                    }}
                  />
                </View>
              </View>
              {contact?.chains && (
                <View className='flex flex-row flex-wrap'>
                  {contact.chains.map((chain, index) => (
                    <View key={index} className='p-1'>
                      <ChainChip chainId={chain} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
          <View className='mt-4 px-4'>
            <TextButton
              onPress={formik.submitForm}
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting}
              text={localization.save[language]}
            />
          </View>
        </Form>
      </ViewWithInset>
      <Alert
        title={localization.deleteContactTitle[language]}
        subtitle={localization.deleteContactBody[language]}
        onCancel={() => setShowDeleteSheet(false)}
        onConfirm={handleRemoveContact}
        isVisible={showDeleteSheet}
      />
      {Platform.OS !== 'web' && (
        <ActionSheet
          isShowing={showScanSheet}
          onClose={handleCloseScanSheet}
          isFullHeight={true}
          hasBottomInset={false}
          hasTopInset={Platform.OS === 'android'}
        >
          <ScanAddressQRCode
            onBack={handleCloseScanSheet}
            onRequestCamera={handleRequestCamera}
            onScanAddress={handleScanAddress}
          />
        </ActionSheet>
      )}
    </>
  );
}
