import { useRef } from 'react';
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
} from 'react-native';
import { RawTextInput } from '.';
import { Tuple } from '../../common/types';
import { id } from '../../common/utils/functions';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { View } from '../view';

export const CodeInput = function <T extends number>(props: {
  length: T;
  text: Tuple<string, T>;
  keyboardType?: TextInputProps['keyboardType'];
  onChange: (text: Tuple<string, T>) => void;
}) {
  const { length, text, keyboardType, onChange } = props;

  const fieldRef = useRef<Record<number, TextInput | null>>({});

  const handleChange = (char: string, index: number) => {
    const parsedChar = char.trim().toUpperCase();
    const isWhitespace = char.length !== 0 && parsedChar.length === 0;

    if (isWhitespace) {
      return;
    } else if (parsedChar.length > 0 && text[index]!.length > 0) {
      return;
    } else if (parsedChar.length > 1) {
      const chars = parsedChar.split('');
      const newText = text.map((_, i) =>
        i >= index ? chars[i - index] || text[i]! : text[i]!,
      );
      onChange(newText as Tuple<string, T>);
      fieldRef.current[Math.min(length - 1, index + chars.length)]?.focus();
      if (index !== length - 1 && char !== '') {
        fieldRef.current[index + 1]?.focus();
      }
    } else {
      const splice = text.map(id);
      splice[index] = parsedChar.toUpperCase();
      onChange(splice as Tuple<string, T>);
      if (index !== length - 1 && char !== '') {
        fieldRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    const key = event.nativeEvent.key;
    if (key === 'Backspace') {
      if (index !== 0 && !text[index]) {
        handleChange('', index - 1);
        fieldRef.current[index - 1]?.focus();
      }
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      fieldRef.current[Math.min(length - 1, index + 1)]?.focus();
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      fieldRef.current[Math.max(0, index - 1)]?.focus();
    }
  };

  return (
    <View className='flex w-full flex-row space-x-2'>
      {Array(length)
        .fill(0)
        .map((_, index) => {
          return (
            <View className='flex-1' key={index}>
              <RawTextInput
                ref={(input) => {
                  if (fieldRef.current) {
                    fieldRef.current[index] = input;
                  }
                }}
                className='text-text-primary bg-card-highlight block w-full rounded-xl text-center text-base font-medium outline-none'
                placeholderTextColor={colors.textPlaceholder}
                style={{
                  minHeight: adjust(48),
                }}
                autoComplete='off'
                autoCorrect={false}
                autoCapitalize='characters'
                keyboardType={keyboardType}
                maxLength={index === length - 1 ? 1 : undefined}
                textAlign='center'
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selection={{ start: 1, end: 2 }}
                value={text[index] || ''}
              />
            </View>
          );
        })}
    </View>
  );
};
