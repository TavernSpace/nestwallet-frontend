import { faSearch, faTimes } from '@fortawesome/pro-regular-svg-icons';
import * as Clipboard from 'expo-clipboard';
import { isEmpty } from 'lodash';
import { Platform, TextInputProps } from 'react-native';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Text } from '../text';
import { RawTextInput } from '../text-input';
import { View } from '../view';

export function SearchInput(props: {
  inputProps?: Partial<TextInputProps>;
  backgroundColor?: string;
  onClear?: VoidFunction;
  onCancel?: VoidFunction;
}) {
  const {
    inputProps,
    backgroundColor = colors.card,
    onClear,
    onCancel,
  } = props;

  const handleTextChange = async () => {
    if (inputProps?.onChangeText) {
      const text = await Clipboard.getStringAsync();
      inputProps.onChangeText(text.trim());
    }
  };

  const pasteColor =
    backgroundColor === colors.cardHighlight
      ? colors.cardHighlightSecondary
      : colors.cardHighlight;
  const clearable = !isEmpty(inputProps?.value);
  const cancelable = !clearable && !!onCancel;
  const pasteable =
    !clearable &&
    !cancelable &&
    inputProps?.editable !== false &&
    Platform.OS !== 'web' &&
    handleTextChange;

  return (
    <View
      className='flex w-full flex-row items-center space-x-4 rounded-xl pl-4 pr-2'
      pointerEvents={inputProps?.editable === false ? 'none' : undefined}
      style={{ backgroundColor, height: adjust(44) }}
    >
      <FontAwesomeIcon
        icon={faSearch}
        color={colors.textSecondary}
        size={adjust(14, 2)}
      />
      <RawTextInput
        className='text-text-primary block flex-1 bg-transparent text-sm font-normal outline-none'
        placeholderTextColor={colors.textPlaceholder}
        style={{
          minHeight: 32,
          paddingBottom: Platform.OS === 'ios' ? 2 : undefined,
        }}
        autoCapitalize='none'
        spellCheck={false}
        autoCorrect={false}
        autoComplete='off'
        {...inputProps}
      />
      {clearable && (
        <BaseButton onPress={onClear}>
          <View className='mr-2 flex items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faTimes}
              size={adjust(18, 2)}
              color={colors.textSecondary}
            />
          </View>
        </BaseButton>
      )}
      {!clearable && cancelable && (
        <BaseButton onPress={onCancel}>
          <View
            className='items-center justify-center rounded-full px-3'
            style={{ height: 30, backgroundColor: pasteColor }}
          >
            <Text className='text-text-secondary text-sm font-medium'>
              {'Cancel'}
            </Text>
          </View>
        </BaseButton>
      )}
      {!clearable && !cancelable && pasteable && (
        <BaseButton onPress={handleTextChange}>
          <View
            className='items-center justify-center rounded-full px-3'
            style={{ height: 30, backgroundColor: pasteColor }}
          >
            <Text className='text-text-secondary text-sm font-medium'>
              {'Paste'}
            </Text>
          </View>
        </BaseButton>
      )}
    </View>
  );
}
