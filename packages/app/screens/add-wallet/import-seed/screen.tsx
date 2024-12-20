import { faChevronDown, faChevronUp } from '@fortawesome/pro-regular-svg-icons';
import {
  faClipboard,
  faEye,
  faEyeSlash,
} from '@fortawesome/pro-solid-svg-icons';
import { SeedPhraseInput } from '@nestwallet/app/common/types';
import { wordlists } from 'bip39';
import cn from 'classnames';
import { Mnemonic } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import { useFormik } from 'formik';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  TextInput,
  TextInputChangeEventData,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { recordify } from '../../../common/utils/functions';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { NeutralIconButton } from '../../../components/button/icon-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { RawTextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { GetSeedPhraseSchema } from './schema';
import { convertSeedPhraseToString } from './util';

export function ImportSeedScreen(props: {
  blockchain: IBlockchainType;
  onSubmit: (seedPhrase: string) => Promise<unknown>;
}) {
  const { blockchain, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [length, setLength] = useState<12 | 24>(12);
  const [hideInput, setHideInput] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [currentInputIndex, setCurrentInputIndex] = useState<number>(0);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const inputRefs = useRef<Record<number, TextInput>>({});

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => setKeyboardVisible(true),
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => setKeyboardVisible(false),
      );
      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    } else {
      return;
    }
  }, []);

  const handleSubmit = async (seed: SeedPhraseInput) => {
    try {
      const seedPhrase = convertSeedPhraseToString(seed);
      if (blockchain === IBlockchainType.Tvm) {
        const words = recordify(wordlists.english!, (word) => word);
        const validLength =
          seed.words.length === 12 || seed.words.length === 24;
        const valid = validLength && seed.words.every((word) => !!words[word]);
        if (!valid) {
          showSnackbar({
            severity: ShowSnackbarSeverity.error,
            message: localization.incorrectSeedPhraseError[language],
          });
        } else {
          await onSubmit(seedPhrase);
        }
      } else if (!Mnemonic.isValidMnemonic(seedPhrase)) {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: localization.incorrectSeedPhraseError[language],
        });
      } else {
        await onSubmit(seedPhrase);
      }
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.defaultError[language],
      });
    }
  };

  const formik = useFormik<SeedPhraseInput>({
    initialValues: {
      words: _.fill(Array(length), ''),
    },
    onSubmit: handleSubmit,
    validationSchema: GetSeedPhraseSchema(length),
  });

  const words = formik.values.words;

  const pasteButtonClicked = async () => {
    const text = await Clipboard.getStringAsync();
    paste(text);
  };

  const handlePaste = (
    event: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    event.preventDefault();
    const text = event.nativeEvent.text;
    paste(text);
  };

  const paste = (text: string) => {
    const words = text.trim().replace(/\s+/g, ' ').split(' ');
    if (words.length === 12) {
      setLength(12);
      formik.setValues({
        words,
      });
    } else if (words.length === 24) {
      setLength(24);
      formik.setValues({
        words,
      });
    } else if (words.length === 1) {
      handleWordChange(0, text.trim());
    } else {
      formik.setValues({
        words:
          words.length > length
            ? words.slice(0, length)
            : words.concat(..._.fill(Array(length - words.length), '')),
      });
    }
  };

  const handleWordChange = (index: number, text: string) => {
    const newWords = [...words];
    newWords[index] = text.trim();
    formik.setFieldValue('words', newWords);
    setCurrentWord(text.trim());
    setCurrentInputIndex(index);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleWordChange(currentInputIndex, suggestion);
    if (currentInputIndex < words.length - 1) {
      setCurrentWord('');
      handleFocusNext();
    }
  };

  const handleFocusPrevious = () => {
    const nextInputIndex = currentInputIndex - 1;
    if (nextInputIndex >= 0) {
      inputRefs.current[nextInputIndex]?.focus();
    }
  };

  const handleFocusNext = () => {
    const nextInputIndex = currentInputIndex + 1;
    if (nextInputIndex < words.length) {
      inputRefs.current[nextInputIndex]?.focus();
    }
  };

  const filteredSuggestions =
    Platform.OS === 'web'
      ? []
      : currentWord.length >= 1 && wordlists.english
      ? wordlists.english
          .filter((word) => word.startsWith(currentWord))
          .slice(0, 3)
      : [];

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <Form className='flex h-full flex-col justify-between' formik={formik}>
        <ScrollView className='px-4' showsVerticalScrollIndicator={false}>
          {/* TODO(Peter): generalize and animate tab component */}
          <View className='flex w-full flex-row'>
            <View className='bg-card mr-3 flex-1 flex-row space-x-1 rounded-lg'>
              <View className='flex-1 rounded-xl'>
                <BaseButton
                  className={cn('w-full overflow-hidden rounded-lg', {
                    'bg-card-highlight': length === 12,
                  })}
                  pressableStyle={{
                    flex: 1,
                  }}
                  onPress={() => {
                    setLength(12);
                    formik.setValues({
                      words: _.fill(Array(12), ''),
                    });
                  }}
                >
                  <View
                    className='items-center justify-center'
                    style={{ height: adjust(36) }}
                  >
                    <Text className='text-text-primary text-center text-sm font-bold'>
                      {localization.wordCount(12)[language]}
                    </Text>
                  </View>
                </BaseButton>
              </View>
              <View className='flex-1 rounded-lg'>
                <BaseButton
                  className={cn('w-full overflow-hidden rounded-lg', {
                    'bg-card-highlight': length === 24,
                  })}
                  pressableStyle={{
                    flex: 1,
                  }}
                  onPress={() => {
                    setLength(24);
                    formik.setValues({
                      words: _.fill(Array(24), ''),
                    });
                  }}
                >
                  <View
                    className='items-center justify-center'
                    style={{ height: adjust(36) }}
                  >
                    <Text className='text-text-primary text-center text-sm font-bold'>
                      {localization.wordCount(24)[language]}
                    </Text>
                  </View>
                </BaseButton>
              </View>
            </View>
            {Platform.OS !== 'web' && (
              <NeutralIconButton
                className='mr-2 flex-none'
                icon={faClipboard}
                size={adjust(36)}
                onPress={pasteButtonClicked}
              />
            )}
            <NeutralIconButton
              className='flex-none'
              size={adjust(36)}
              icon={hideInput ? faEye : faEyeSlash}
              onPress={() => setHideInput(!hideInput)}
            />
          </View>

          <View className='bg-card mb-2 mt-4 flex rounded-xl px-4 pb-5 pt-2'>
            <View className='flex flex-row justify-between'>
              <View className='flex-1 flex-col overflow-hidden px-2'>
                {_.slice(words, 0, words.length / 2).map((word, index) => {
                  const number = index + 1;
                  const isFirst = index === 0;
                  return (
                    <SeedInput
                      key={number}
                      number={number}
                      inputProps={{
                        autoCapitalize: 'none',
                        onChange: isFirst ? handlePaste : undefined,
                        onChangeText: isFirst
                          ? undefined
                          : (text) => handleWordChange(index, text),
                        value: word,
                        secureTextEntry: hideInput,
                        onFocus: () =>
                          handleWordChange(index, words[index] ?? ''),
                      }}
                      inputRef={(input: TextInput) =>
                        (inputRefs.current[index] = input)
                      }
                    />
                  );
                })}
              </View>
              <View className='flex-1 flex-col overflow-hidden px-2'>
                {_.slice(words, words.length / 2, words.length).map(
                  (word, sliceIndex) => {
                    const index = words.length / 2 + sliceIndex;
                    const number = index + 1;
                    return (
                      <SeedInput
                        key={number}
                        number={number}
                        inputProps={{
                          autoCapitalize: 'none',
                          onChangeText: (text) => handleWordChange(index, text),
                          value: word,
                          secureTextEntry: hideInput,
                          onFocus: () =>
                            handleWordChange(index, words[index] ?? ''),
                        }}
                        inputRef={(input: TextInput) =>
                          (inputRefs.current[index] = input)
                        }
                      />
                    );
                  },
                )}
              </View>
            </View>
          </View>
        </ScrollView>
        <View className='mt-3 flex flex-col px-4'>
          {keyboardVisible && (
            <View className='mb-3 flex flex-row items-center justify-center space-x-2'>
              {currentWord.length >= 1 && filteredSuggestions.length > 0 ? (
                <View className='flex flex-1 flex-row justify-center space-x-2'>
                  {filteredSuggestions.map((suggestion, index) => (
                    <BaseButton
                      className='flex-1'
                      key={index}
                      onPress={() => handleSuggestionClick(suggestion)}
                    >
                      <View className='bg-card h-9 items-center justify-center rounded-md'>
                        <Text className='text-text-primary text-center text-sm font-medium'>
                          {suggestion}
                        </Text>
                      </View>
                    </BaseButton>
                  ))}
                </View>
              ) : currentWord.length >= 1 &&
                filteredSuggestions.length === 0 ? (
                <View className='bg-warning/10 h-9 flex-1 items-center justify-center rounded-md'>
                  <Text className='text-warning text-center text-sm font-medium'>
                    {localization.unkownWord[language]}
                  </Text>
                </View>
              ) : (
                <View className='flex flex-1 flex-row justify-center space-x-2'>
                  <View className='bg-card h-9 flex-1 items-center justify-between rounded-md' />
                  <View className='bg-card h-9 flex-1 items-center justify-between rounded-md' />
                  <View className='bg-card h-9 flex-1 items-center justify-between rounded-md' />
                </View>
              )}
              <BaseButton
                onPress={handleFocusNext}
                disabled={currentInputIndex === words.length - 1}
              >
                <View className='bg-card h-9 w-9 items-center justify-center rounded-md'>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    size={18}
                    color={
                      currentInputIndex === words.length - 1
                        ? colors.cardHighlight
                        : colors.textSecondary
                    }
                  />
                </View>
              </BaseButton>
              <BaseButton
                onPress={handleFocusPrevious}
                disabled={currentInputIndex === 0}
              >
                <View className='bg-card h-9 w-9 items-center justify-center rounded-md'>
                  <FontAwesomeIcon
                    icon={faChevronUp}
                    size={18}
                    color={
                      currentInputIndex === 0
                        ? colors.cardHighlight
                        : colors.textSecondary
                    }
                  />
                </View>
              </BaseButton>
            </View>
          )}
          {!keyboardVisible && (
            <View className='bg-card mb-2 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.encryptedKeysMessage[language]}
              </Text>
            </View>
          )}
          <TextButton
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting || words.some((word) => word === '')}
            onPress={formik.submitForm}
            text={localization.import[language]}
          />
        </View>
      </Form>
    </ViewWithInset>
  );
}

function SeedInput(props: {
  number: number;
  inputProps: TextInputProps;
  style?: StyleProp<ViewStyle>;
  inputRef?: React.Ref<TextInput>;
}) {
  const { number, inputProps, style, inputRef } = props;
  return (
    <View
      className='flex flex-row items-center overflow-hidden'
      key={number}
      style={style}
    >
      <View className='w-6 flex-none'>
        <Text className='text-text-primary text-xs font-medium'>{number}</Text>
      </View>
      <View
        className={cn('w-[1/2] flex-1', {
          'my-1': Platform.OS !== 'web',
        })}
      >
        <RawTextInput
          ref={inputRef}
          className='border-card-highlight text-text-secondary border-b text-sm font-normal outline-none'
          style={{ minHeight: 36 }}
          inputMode='text'
          {...inputProps}
          placeholderTextColor={colors.textPlaceholder}
          autoCorrect={false}
          spellCheck={false}
        />
      </View>
    </View>
  );
}
