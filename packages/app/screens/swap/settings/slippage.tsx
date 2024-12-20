import cn from 'classnames';
import { Platform } from 'react-native';
import { Tuple } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { InlineErrorTooltip } from '../../../components/input-error';
import { Text } from '../../../components/text';
import { RawTextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { validDecimalAmount } from '../../../features/crypto/transfer';

export interface SlippageSectionProps {
  slippage: string;
  slippageDefaults: Tuple<number, 3>;
  slippageError?: string;
  onSlippageChange: (slippage: string) => Promise<void>;
}

export function SlippageSection(props: SlippageSectionProps) {
  const { slippage, slippageDefaults, slippageError, onSlippageChange } = props;

  const handleSlippageChange = (value: string) => {
    const validNumber = validDecimalAmount(value, 2);
    onSlippageChange(validNumber);
  };

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'Slippage'}
      </Text>
      <View className='bg-card rounded-2xl px-4 py-3'>
        <View className='flex flex-row space-x-2'>
          {slippageDefaults.map((value, index) => (
            <BaseButton
              key={index}
              onPress={() => handleSlippageChange(value!.toString())}
            >
              <View
                className='bg-card-highlight h-12 items-center justify-center rounded-xl px-2'
                style={{ width: adjust(48, 8) }}
              >
                <Text className='text-text-primary text-sm font-normal'>
                  {`${value}%`}
                </Text>
              </View>
            </BaseButton>
          ))}
          <View className='bg-card-highlight flex flex-1 flex-row items-center justify-between overflow-hidden rounded-xl pl-3 pr-4'>
            <Text className='text-text-secondary flex flex-none text-center text-sm font-normal'>
              {'%'}
            </Text>
            <RawTextInput
              className={cn(
                'text-text-primary text-right text-sm font-normal outline-none',
                {
                  'w-full': Platform.OS === 'web',
                  'flex-1': Platform.OS !== 'web',
                },
              )}
              id='slippage'
              placeholder='3'
              placeholderTextColor={colors.textPlaceholder}
              autoComplete='off'
              inputMode='decimal'
              onChangeText={handleSlippageChange}
              value={slippage.toString()}
            />
          </View>
        </View>
        {!!slippageError && (
          <View className='mt-2 flex w-full flex-row items-center'>
            <InlineErrorTooltip isEnabled={true} errorText={slippageError} />
          </View>
        )}
      </View>
    </View>
  );
}
