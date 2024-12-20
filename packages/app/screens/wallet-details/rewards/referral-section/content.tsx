import { useState } from 'react';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { TextInput } from '../../../../components/text-input';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';

interface EnterCodeContentProps {
  loading: boolean;
  onConfirm: (code: string) => void;
  onSkip?: VoidFunction;
  onClose: VoidFunction;
}

export function EnterCodeContent(props: EnterCodeContentProps) {
  const { loading, onConfirm, onSkip, onClose } = props;

  const [code, setCode] = useState<string>('');

  return (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title='Enter Referral Code'
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col space-y-4 px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {`Enter a referral code to get a discount on all swaps and an XP boost on quests. ${
            onSkip
              ? 'You can always add one later.'
              : 'A portion of your trading fees will be distributed to the referrer.'
          }`}
        </Text>
        <View className='flex flex-1 flex-row'>
          <TextInput
            inputProps={{
              placeholder: 'Referral Code',
              placeholderTextColor: colors.textPlaceholder,
              value: code,
              onChangeText: (text) => setCode(text.trim().toUpperCase()),
              autoCapitalize: 'characters',
            }}
          />
        </View>
        <View className='flex flex-row space-x-4 pt-2'>
          {onSkip && (
            <View className='flex-1'>
              <TextButton
                text='Skip'
                type='tertiary'
                onPress={onSkip}
                loading={loading}
                disabled={loading}
              />
            </View>
          )}
          <View className='flex-1'>
            <TextButton
              text='Confirm'
              disabled={loading || code.length < 4 || code.length > 12}
              loading={loading}
              onPress={() => onConfirm(code)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
