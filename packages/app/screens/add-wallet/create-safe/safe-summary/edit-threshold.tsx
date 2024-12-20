import { useFormik } from 'formik';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';
import { ChangeThresholdInputSchema } from './schema';

interface ChangeThresholdInput {
  threshold: number;
}

interface EditThresholdContentProps {
  signerCount: number;
  threshold: number;
  onClose: VoidFunction;
  onChangeThreshold: (threshold: number) => void;
}

export function EditThresholdContent(props: EditThresholdContentProps) {
  const { signerCount, threshold, onClose, onChangeThreshold } = props;
  const { language } = useLanguageContext();
  const handleNumericChange = (textSetter: (value: string) => void) => {
    return (value: string) => {
      const validNumber = value.replace(/[^0-9]/g, '');
      textSetter(validNumber);
    };
  };

  const handleSubmit = async (input: ChangeThresholdInput) => {
    onChangeThreshold(input.threshold);
    onClose();
  };

  const formik = useFormik<ChangeThresholdInput>({
    initialValues: {
      threshold,
    },
    validationSchema: ChangeThresholdInputSchema(signerCount, language),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title={localization.editThreshold[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='bg-background flex flex-col px-4'>
        <TextInput
          errorText={
            formik.touched.threshold ? formik.errors.threshold : undefined
          }
          inputProps={{
            id: 'address',
            placeholder: localization.thresholdPlaceholder[language],
            onChangeText: handleNumericChange(formik.handleChange('threshold')),
            value: formik.values.threshold.toString(),
          }}
        />
        <View className='mt-6 w-full'>
          <TextButton
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
            text={localization.confirm[language]}
          />
        </View>
      </View>
    </View>
  );
}
