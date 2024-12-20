import { SafeInfoResponse } from '@safe-global/api-kit';
import { useFormik } from 'formik';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { parseError } from '../../../../features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import {
  AddSignerInputSchema,
  ChangeThresholdInputSchema,
  RemoveSignerInputSchema,
  SwapSignerInputSchema,
} from './schema';

export type EditOperation =
  | {
      type: 'remove' | 'swap';
      address: string;
    }
  | {
      type: 'threshold' | 'add';
    };

interface EditSignersProps {
  safeInfo: SafeInfoResponse;
  operation: EditOperation;
  onAddSigner: (address: string, threshold: number) => Promise<void>;
  onRemoveSigner: (address: string, threshold: number) => Promise<void>;
  onSwapSigner: (oldAddress: string, newAddress: string) => Promise<void>;
  onChangeThreshold: (threshold: number) => Promise<void>;
  onClose: VoidFunction;
}

export function EditSignersContent(props: EditSignersProps) {
  const {
    safeInfo,
    operation,
    onClose,
    onAddSigner,
    onChangeThreshold,
    onRemoveSigner,
    onSwapSigner,
  } = props;

  const title =
    operation.type === 'add'
      ? 'Add Signer'
      : operation.type === 'remove'
      ? 'Remove Signer'
      : operation.type === 'swap'
      ? 'Swap Signer'
      : 'Change Threshold';

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader title={title} onClose={onClose} type={'detached'} />
      <View className='space-y-2 px-4'>
        {operation.type === 'add' && (
          <AddSignerContent safeInfo={safeInfo} onAddSigner={onAddSigner} />
        )}
        {operation.type === 'remove' && (
          <RemoveSignerContent
            address={operation.address}
            safeInfo={safeInfo}
            onRemoveSigner={onRemoveSigner}
          />
        )}
        {operation.type === 'swap' && (
          <SwapSignerContent
            address={operation.address}
            safeInfo={safeInfo}
            onSwapSigner={onSwapSigner}
          />
        )}
        {operation.type === 'threshold' && (
          <ChangeThresholdContent
            safeInfo={safeInfo}
            onChangeThreshold={onChangeThreshold}
          />
        )}
      </View>
    </View>
  );
}

// ADD SIGNER

interface AddSignerInput {
  address: string;
  threshold: number;
}

interface AddSignerContentProps {
  safeInfo: SafeInfoResponse;
  onAddSigner: (address: string, threshold: number) => Promise<void>;
}

function AddSignerContent(props: AddSignerContentProps) {
  const { safeInfo, onAddSigner } = props;
  const { showSnackbar } = useSnackbar();

  const handleNumericChange = (textSetter: (value: string) => void) => {
    return (value: string) => {
      const validNumber = value.replace(/[^0-9]/g, '');
      textSetter(validNumber);
    };
  };

  const handleSubmit = async (input: AddSignerInput) => {
    try {
      await onAddSigner(input.address, input.threshold);
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const formik = useFormik<AddSignerInput>({
    initialValues: {
      address: '',
      threshold: safeInfo.threshold,
    },
    validationSchema: AddSignerInputSchema(safeInfo),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col space-y-4 pt-2'>
      <View className='flex flex-col space-y-2'>
        <Text className='text-text-primary text-sm font-medium'>Address</Text>
        <TextInput
          errorText={formik.touched.address ? formik.errors.address : undefined}
          inputProps={{
            id: 'address',
            placeholder: 'Ex: 0x3Ef5...2sdf',
            onChangeText: formik.handleChange('address'),
            value: formik.values.address,
          }}
        />
      </View>
      <View className='flex flex-col space-y-2'>
        <View className='flex flex-row justify-between'>
          <Text className='text-text-primary text-sm font-medium'>
            Threshold
          </Text>
          <Text className='text-text-secondary text-sm font-medium'>{`Current Threshold: ${safeInfo.threshold}`}</Text>
        </View>
        <TextInput
          errorText={
            formik.touched.threshold ? formik.errors.threshold : undefined
          }
          inputProps={{
            id: 'address',
            placeholder: '2',
            onChangeText: handleNumericChange(formik.handleChange('threshold')),
            value: formik.values.threshold.toString(),
          }}
        />
      </View>
      <TextButton
        text={'Confirm'}
        onPress={formik.submitForm}
        loading={formik.isSubmitting}
        disabled={formik.isSubmitting}
      />
    </View>
  );
}

// REMOVE SIGNER

interface RemoveSignerInput {
  threshold: number;
}

interface RemoveSignerContentProps {
  address: string;
  safeInfo: SafeInfoResponse;
  onRemoveSigner: (address: string, threshold: number) => Promise<void>;
}

function RemoveSignerContent(props: RemoveSignerContentProps) {
  const { address, safeInfo, onRemoveSigner } = props;
  const { showSnackbar } = useSnackbar();

  const handleNumericChange = (textSetter: (value: string) => void) => {
    return (value: string) => {
      const validNumber = value.replace(/[^0-9]/g, '');
      textSetter(validNumber);
    };
  };

  const handleSubmit = async (input: RemoveSignerInput) => {
    try {
      await onRemoveSigner(address, input.threshold);
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const formik = useFormik<RemoveSignerInput>({
    initialValues: {
      threshold:
        safeInfo.threshold === safeInfo.owners.length
          ? safeInfo.threshold - 1
          : safeInfo.threshold,
    },
    validationSchema: RemoveSignerInputSchema(safeInfo),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col space-y-4 pt-2'>
      <View className='flex flex-col space-y-2'>
        <View className='flex flex-row justify-between'>
          <Text className='text-text-primary text-sm font-medium'>
            Threshold
          </Text>
          <Text className='text-text-secondary text-sm font-medium'>{`Current Threshold: ${safeInfo.threshold}`}</Text>
        </View>
        <TextInput
          errorText={
            formik.touched.threshold ? formik.errors.threshold : undefined
          }
          inputProps={{
            id: 'address',
            placeholder: '2',
            onChangeText: handleNumericChange(formik.handleChange('threshold')),
            value: formik.values.threshold.toString(),
          }}
        />
      </View>
      <TextButton
        text={'Confirm'}
        onPress={formik.submitForm}
        loading={formik.isSubmitting}
        disabled={formik.isSubmitting}
      />
    </View>
  );
}

// SWAP SIGNER

interface SwapSignerInput {
  address: string;
}

interface SwapSignerContentProps {
  address: string;
  safeInfo: SafeInfoResponse;
  onSwapSigner: (oldAddress: string, newAddress: string) => Promise<void>;
}

function SwapSignerContent(props: SwapSignerContentProps) {
  const { address, safeInfo, onSwapSigner } = props;
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (input: SwapSignerInput) => {
    try {
      await onSwapSigner(address, input.address);
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const formik = useFormik<SwapSignerInput>({
    initialValues: {
      address: '',
    },
    validationSchema: SwapSignerInputSchema(safeInfo),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col space-y-4 pt-2'>
      <View className='flex flex-col space-y-2'>
        <Text className='text-text-primary text-sm font-medium'>Address</Text>
        <TextInput
          errorText={formik.touched.address ? formik.errors.address : undefined}
          inputProps={{
            id: 'address',
            placeholder: 'Ex: 0x3Ef5...2sdf',
            onChangeText: formik.handleChange('address'),
            value: formik.values.address,
          }}
        />
      </View>
      <TextButton
        text={'Confirm'}
        onPress={formik.submitForm}
        loading={formik.isSubmitting}
        disabled={formik.isSubmitting}
      />
    </View>
  );
}

// CHANGE THRESHOLD

interface ChangeThresholdInput {
  threshold: number;
}

interface ChangeThresholdContentProps {
  safeInfo: SafeInfoResponse;
  onChangeThreshold: (threshold: number) => Promise<void>;
}

function ChangeThresholdContent(props: ChangeThresholdContentProps) {
  const { safeInfo, onChangeThreshold } = props;
  const { showSnackbar } = useSnackbar();

  const handleNumericChange = (textSetter: (value: string) => void) => {
    return (value: string) => {
      const validNumber = value.replace(/[^0-9]/g, '');
      textSetter(validNumber);
    };
  };

  const handleSubmit = async (input: ChangeThresholdInput) => {
    try {
      await onChangeThreshold(input.threshold);
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const formik = useFormik<ChangeThresholdInput>({
    initialValues: {
      threshold: safeInfo.threshold,
    },
    validationSchema: ChangeThresholdInputSchema(safeInfo),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col space-y-4 pt-4'>
      <View className='flex flex-col space-y-2'>
        <View className='flex flex-row justify-between'>
          <Text className='text-text-primary text-sm font-medium'>
            Threshold
          </Text>
          <Text className='text-text-secondary text-sm font-medium'>{`Current Threshold: ${safeInfo.threshold}`}</Text>
        </View>
        <TextInput
          errorText={
            formik.touched.threshold ? formik.errors.threshold : undefined
          }
          inputProps={{
            id: 'address',
            placeholder: '2',
            onChangeText: handleNumericChange(formik.handleChange('threshold')),
            value: formik.values.threshold.toString(),
          }}
        />
      </View>
      <TextButton
        text={'Confirm'}
        onPress={formik.submitForm}
        loading={formik.isSubmitting}
        disabled={formik.isSubmitting}
      />
    </View>
  );
}
