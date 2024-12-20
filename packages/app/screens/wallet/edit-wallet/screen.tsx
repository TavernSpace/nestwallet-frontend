import { parseError } from '@nestwallet/app/features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { useFormik } from 'formik';
import { useState } from 'react';
import { ReactNativeFile } from '../../../common/hooks/graphql';
import { VoidPromiseFunction } from '../../../common/types';
import { TextButton } from '../../../components/button/text-button';
import { FileInput } from '../../../components/file-input/default';
import { Form } from '../../../components/form';
import { ActionSheet } from '../../../components/sheet';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import {
  IUpsertWalletInput,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { UpsertWalletInputSchema } from '../edit-wallet-schema';

export const deletionUUID = '11111111-1111-1111-1111-111111111111';

export function EditWalletScreen(props: {
  wallet: IWallet;
  onUpdateWallet: (value: IUpsertWalletInput) => Promise<void>;
  onDelete: VoidPromiseFunction;
}) {
  const { wallet, onUpdateWallet, onDelete } = props;
  const { showSnackbar } = useSnackbar();

  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Successfully deleted wallet!',
      });
    } catch (err) {
      const appError = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message:
          appError.message === 'cannot delete wallet with Nest'
            ? 'Wallets that minted the Nest cannot be deleted.'
            : appError.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (value: IUpsertWalletInput) => {
    try {
      await onUpdateWallet(value);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Successfully updated wallet!',
      });
    } catch (err) {
      const appError = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: appError.message,
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
            ? 'SVG files are not supported'
            : 'TIFF files are not supported',
      });
    } else {
      formik.setFieldValue('profilePictureUpload', value);
      formik.setFieldValue('profilePicture', undefined);
    }
  };

  const formik = useFormik<IUpsertWalletInput>({
    initialValues: {
      id: wallet.id,
      blockchain: wallet.blockchain,
      chainId: wallet.chainId,
      name: wallet.name,
      address: wallet.address,
      type: wallet.type,
      organizationId: wallet.organization.id,
      color: wallet.color,
      profilePicture: undefined,
      profilePictureUpload: undefined,
    },
    validationSchema: UpsertWalletInputSchema,
    onSubmit: handleSubmitEdit,
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
        <View className='flex flex-col'>
          <View className='mt-4 space-y-4'>
            <View className='items-center justify-center'>
              <FileInput
                title='Edit Wallet Image'
                defaultValue={wallet.profilePicture ?? undefined}
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
            <View className='space-y-2'>
              <Text className='text-text-primary text-sm font-medium'>
                Name
              </Text>
              <TextInput
                errorText={formik.touched.name ? formik.errors.name : undefined}
                inputProps={{
                  id: 'name',
                  placeholder: wallet.name,
                  onChangeText: formik.handleChange('name'),
                  value: formik.values.name,
                }}
              />
            </View>
          </View>
        </View>
        <View className='flex flex-row space-x-4'>
          <View className='flex-1'>
            <TextButton
              type='tertiary'
              text='Delete'
              disabled={formik.isSubmitting}
              onPress={() => setShowDeleteSheet(true)}
            />
          </View>
          <View className='flex-1'>
            <TextButton
              onPress={formik.submitForm}
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting}
              text='Confirm'
            />
          </View>
        </View>
      </Form>
      <ActionSheet
        isShowing={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        isDetached={true}
      >
        <ActionSheetHeader
          title='Delete Wallet'
          onClose={() => setShowDeleteSheet(false)}
          type='detached'
        />
        <View className='px-4 pb-4'>
          <Text className='text-text-secondary text-sm font-normal'>
            {
              'WARNING: This action cannot be undone. Are you sure you want to delete this wallet? It will remove this wallet from all your devices.'
            }
          </Text>
        </View>
        <View className='flex w-full flex-row space-x-4 px-4'>
          <View className='flex-1'>
            <TextButton
              text='Cancel'
              type='tertiary'
              disabled={isSubmitting}
              onPress={() => setShowDeleteSheet(false)}
            />
          </View>
          <View className='flex-1'>
            <TextButton
              text='Delete'
              onPress={handleDelete}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </ActionSheet>
    </ViewWithInset>
  );
}
