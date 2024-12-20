import { BaseButton } from '../../../components/button/base-button';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { validDecimalAmount } from '../../../features/crypto/transfer';

export interface TipSectionProps {
  tip: string;
  tipError?: string;
  mev: boolean;
  onTipChange: (tip: string) => Promise<void>;
}

export function TipSection(props: TipSectionProps) {
  const { tip, mev, tipError, onTipChange } = props;

  const handleTipChange = (text: string) => {
    onTipChange(validDecimalAmount(text, 9));
  };

  const mevError =
    mev && (tip === '' || parseFloat(tip) === 0)
      ? 'A tip is required when MEV protection is enabled'
      : undefined;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>{'Tip'}</Text>
      <View className='bg-card space-y-3 rounded-2xl px-4 py-3'>
        <View className='flex flex-col space-y-2'>
          <TextInput
            inputProps={{
              id: 'jito_tip',
              placeholder: 'Enter SOL tip',
              onChangeText: handleTipChange,
              inputMode: 'decimal',
              value: tip,
            }}
            filled={true}
            errorText={tipError || mevError}
            endAdornment={
              tip === '' ? undefined : (
                <View className='pr-4'>
                  <Text className='text-text-secondary text-sm font-normal'>
                    {'SOL'}
                  </Text>
                </View>
              )
            }
          />
          <View className='flex flex-row items-center space-x-2'>
            <BaseButton
              className='flex-1'
              onPress={() => handleTipChange('0.0001')}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'0.0001'}
                </Text>
              </View>
            </BaseButton>
            <BaseButton
              className='flex-1'
              onPress={() => handleTipChange('0.001')}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'0.001'}
                </Text>
              </View>
            </BaseButton>
            <BaseButton
              className='flex-1'
              onPress={() => handleTipChange('0.01')}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'0.01'}
                </Text>
              </View>
            </BaseButton>
          </View>
        </View>
        <View className='bg-card-highlight h-[1px]' />
        <Text className='text-text-secondary text-xs font-normal'>
          {
            'In order to protect or speed up your transactions, you must add a minimum 0.0001 SOL tip to Jito.'
          }
        </Text>
      </View>
    </View>
  );
}
