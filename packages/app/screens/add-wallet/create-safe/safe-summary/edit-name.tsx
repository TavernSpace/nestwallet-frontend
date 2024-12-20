import { useFormik } from 'formik';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';
import { ChangeNameInputSchema } from './schema';

interface ChangeNameInput {
  name: string;
}

interface EditNameContentProps {
  name: string;
  onClose: VoidFunction;
  onChangeName: (name: string) => void;
}

export function EditNameContent(props: EditNameContentProps) {
  const { name, onClose, onChangeName } = props;
  const { language } = useLanguageContext();
  const handleSubmit = async (input: ChangeNameInput) => {
    onChangeName(input.name);
    onClose();
  };

  const formik = useFormik<ChangeNameInput>({
    initialValues: {
      name,
    },
    validationSchema: ChangeNameInputSchema(language),
    onSubmit: handleSubmit,
  });

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title={localization.editName[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='bg-background flex flex-col px-4'>
        <TextInput
          errorText={formik.touched.name ? formik.errors.name : undefined}
          inputProps={{
            id: 'address',
            placeholder: localization.namePlaceholder[language],
            onChangeText: formik.handleChange('name'),
            value: formik.values.name,
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
