import { useFormik } from 'formik';
import { useState } from 'react';
import { BaseButton } from '../../components/button/base-button';
import { TextButton } from '../../components/button/text-button';
import { Checkbox } from '../../components/checkbox';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { TextInput } from '../../components/text-input';
import { View } from '../../components/view';
import { validDecimalAmount } from '../../features/crypto/transfer';
import { JitoTipSchema } from './schema';

interface JitoTipContentProps {
  mev: boolean;
  initialTip?: string;
  onTipChange: (mev: boolean, tip?: string) => void;
  onClose: VoidFunction;
}

interface JitoTipSheetProps extends JitoTipContentProps {
  isShowing: boolean;
}

export function JitoTipSheet(props: JitoTipSheetProps) {
  const { isShowing, mev, initialTip, onTipChange, onClose } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <JitoTipContent
        mev={mev}
        initialTip={initialTip}
        onTipChange={onTipChange}
        onClose={onClose}
      />
    </ActionSheet>
  );
}

function JitoTipContent(props: JitoTipContentProps) {
  const { mev, initialTip, onTipChange, onClose } = props;

  const [curMev, setCurMev] = useState(mev);

  const handleSubmit = (input: { tip?: string }) => {
    onTipChange(curMev, input.tip);
    onClose();
  };

  const formik = useFormik({
    initialValues: {
      tip: initialTip ?? '',
    },
    onSubmit: handleSubmit,
    validationSchema: JitoTipSchema,
  });

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader title='Add Tip' onClose={onClose} type='detached' />
      <View className='flex flex-col space-y-2 px-4'>
        <BaseButton onPress={() => setCurMev(!curMev)}>
          <View className='bg-card flex flex-row items-center justify-between rounded-xl px-4 py-3'>
            <Text className='text-text-primary text-sm font-medium'>
              {'MEV Protection'}
            </Text>
            <Checkbox selected={curMev} />
          </View>
        </BaseButton>
        <TextInput
          inputProps={{
            id: 'jito_tip',
            placeholder: 'Enter SOL tip',
            onChangeText: (text) =>
              formik.setFieldValue('tip', validDecimalAmount(text, 9)),
            inputMode: 'decimal',
            value: formik.values.tip,
          }}
          errorText={formik.errors.tip}
        />
        <View className='flex flex-row items-center space-x-2'>
          <BaseButton
            className='flex-1'
            onPress={() => formik.setFieldValue('tip', '0.0001')}
          >
            <View className='bg-card items-center justify-center rounded-xl py-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {'0.0001'}
              </Text>
            </View>
          </BaseButton>
          <BaseButton
            className='flex-1'
            onPress={() => formik.setFieldValue('tip', '0.001')}
          >
            <View className='bg-card items-center justify-center rounded-xl py-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {'0.001'}
              </Text>
            </View>
          </BaseButton>
          <BaseButton
            className='flex-1'
            onPress={() => formik.setFieldValue('tip', '0.01')}
          >
            <View className='bg-card items-center justify-center rounded-xl py-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {'0.01'}
              </Text>
            </View>
          </BaseButton>
        </View>
        <View className='bg-card rounded-xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {
              'In order to protect or speed up your transactions, you must add a minimum 0.0001 SOL tip to Jito.'
            }
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <TextButton
            className='flex-1'
            type='tertiary'
            text={'Disable'}
            onPress={() => handleSubmit({ tip: undefined })}
          />
          <TextButton
            className='flex-1'
            text={'Confirm'}
            onPress={formik.submitForm}
            disabled={!!formik.errors.tip || formik.values.tip === ''}
          />
        </View>
      </View>
    </View>
  );
}
