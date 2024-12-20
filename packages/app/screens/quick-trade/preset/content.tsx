import cn from 'classnames';
import { useFormik } from 'formik';
import { Platform, View } from 'react-native';
import { Tuple } from '../../../common/types';
import { TextButton } from '../../../components/button/text-button';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { RawTextInput } from '../../../components/text-input';
import { colors } from '../../../design/constants';
import { validDecimalAmount } from '../../../features/crypto/transfer';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { AbsolutePresetsSchema, PercentagePresetsSchema } from './schema';

interface PresetAmountInput {
  amount0: string;
  amount1: string;
  amount2: string;
}

interface PresetAmountContentProps {
  presets: Tuple<string, 3>;
  decimals: number;
  onPresetsChange: (presets: Tuple<string, 3>) => Promise<void>;
  onClose: VoidFunction;
}

export function PresetAmountContent(props: PresetAmountContentProps) {
  const { presets, decimals, onPresetsChange, onClose } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (input: PresetAmountInput) => {
    try {
      await onPresetsChange([input.amount0, input.amount1, input.amount2]);
      onClose();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.updatedPresets[language],
      });
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorUpdatingPresets[language],
      });
    }
  };

  const isPercentage = presets[0][presets[0].length - 1] === '%';

  const formik = useFormik<PresetAmountInput>({
    initialValues: {
      amount0: isPercentage ? presets[0].slice(0, -1) : presets[0],
      amount1: isPercentage ? presets[1].slice(0, -1) : presets[1],
      amount2: isPercentage ? presets[2].slice(0, -1) : presets[2],
    },
    validationSchema: isPercentage
      ? PercentagePresetsSchema
      : AbsolutePresetsSchema,
    onSubmit: handleSubmit,
  });

  const handleChange = (field: string) => (value: string) => {
    if (isPercentage) {
      formik.handleChange(field)(validDecimalAmount(value, 0));
    } else {
      formik.handleChange(field)(validDecimalAmount(value, decimals));
    }
  };

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title={localization.editPresets[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='mx-4 mb-2 flex flex-row space-x-2'>
        <View className='bg-card flex h-10 flex-1 flex-row items-center rounded-xl px-2'>
          <RawTextInput
            className={cn(
              'text-text-primary flex-1 text-center text-sm font-normal outline-none',
              { 'w-full': Platform.OS === 'web' },
            )}
            id={'amount0'}
            placeholder={'0'}
            placeholderTextColor={colors.textPlaceholder}
            value={formik.values.amount0}
            autoComplete='off'
            inputMode={isPercentage ? 'numeric' : 'decimal'}
            onChangeText={handleChange('amount0')}
          />
          {isPercentage && (
            <Text className='text-text-secondary text-sm font-normal'>
              {'%'}
            </Text>
          )}
        </View>
        <View className='bg-card flex h-10 flex-1 flex-row items-center rounded-xl px-2'>
          <RawTextInput
            className={cn(
              'text-text-primary flex-1 text-center text-sm font-normal outline-none',
              { 'w-full': Platform.OS === 'web' },
            )}
            id={'amount1'}
            placeholder={'0'}
            placeholderTextColor={colors.textPlaceholder}
            value={formik.values.amount1}
            autoComplete='off'
            inputMode={isPercentage ? 'numeric' : 'decimal'}
            onChangeText={handleChange('amount1')}
          />
          {isPercentage && (
            <Text className='text-text-secondary text-sm font-normal'>
              {'%'}
            </Text>
          )}
        </View>
        <View className='bg-card flex h-10 flex-1 flex-row items-center rounded-xl px-2'>
          <RawTextInput
            className={cn(
              'text-text-primary flex-1 text-center text-sm font-normal outline-none',
              { 'w-full': Platform.OS === 'web' },
            )}
            id={'amount2'}
            placeholder={'0'}
            placeholderTextColor={colors.textPlaceholder}
            value={formik.values.amount2}
            autoComplete='off'
            inputMode={isPercentage ? 'numeric' : 'decimal'}
            onChangeText={handleChange('amount2')}
          />
          {isPercentage && (
            <Text className='text-text-secondary text-sm font-normal'>
              {'%'}
            </Text>
          )}
        </View>
      </View>
      <View className='flex flex-col space-y-2 px-4'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.editPresetsDescription[language]}
          </Text>
        </View>
        <TextButton
          text={localization.confirm[language]}
          loading={formik.isSubmitting}
          onPress={formik.submitForm}
          disabled={
            !!formik.errors.amount0 ||
            !!formik.errors.amount1 ||
            !!formik.errors.amount2 ||
            formik.isSubmitting
          }
        />
      </View>
    </View>
  );
}
