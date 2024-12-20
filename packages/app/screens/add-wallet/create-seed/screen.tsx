import { faClone } from '@fortawesome/pro-solid-svg-icons';
import { SeedPhrase, VoidPromiseFunction } from '@nestwallet/app/common/types';
import { useState } from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';
import { useCopy } from '../../../common/hooks/copy';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export function CreateSeedScreen(props: {
  onSubmit: VoidPromiseFunction;
  seedPhrase: SeedPhrase;
}) {
  const { onSubmit, seedPhrase } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();
  const { copy } = useCopy('Copied seed phrase!');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
    } catch (err) {
      const error = parseError(err, localization.error[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset
      className='flex h-full flex-col justify-between px-4'
      hasBottomInset={true}
    >
      <ScrollView>
        <SeedPhraseCard seedPhrase={seedPhrase} />
        <View className='flex flex-row items-center justify-center pt-2'>
          <BaseButton
            className='overflow-hidden rounded-xl'
            onPress={() => copy(seedPhrase.join(' '))}
          >
            <View className='bg-card flex flex-row items-center justify-center space-x-2 rounded-xl px-3 py-2'>
              <FontAwesomeIcon
                icon={faClone}
                className='text-text-secondary'
                size={adjust(14, 2)}
              />
              <Text className='text-text-secondary text-sm font-medium'>
                {localization.copy[language]}
              </Text>
            </View>
          </BaseButton>
        </View>
      </ScrollView>

      <View className='flex flex-col space-y-2'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.securityInfo[language]}
          </Text>
        </View>
        <TextButton
          onPress={handleSubmit}
          text={localization.continue[language]}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ViewWithInset>
  );
}

export function SeedPhraseCard(props: { seedPhrase: SeedPhrase }) {
  const { seedPhrase } = props;
  const leftSide =
    seedPhrase.length === 12
      ? [0, 1, 2, 3, 4, 5]
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const rightSide =
    seedPhrase.length === 12
      ? [6, 7, 8, 9, 10, 11]
      : [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  return (
    <View className='bg-card mt-4 flex rounded-xl px-4 pb-4 pt-3'>
      <View className='flex flex-row justify-between'>
        <View className='flex-1 flex-col space-y-3 overflow-hidden px-2'>
          {leftSide.map((index: number) => {
            return (
              <SeedWord index={index} seedPhrase={seedPhrase} key={index} />
            );
          })}
        </View>
        <View className='flex-1 flex-col space-y-3 overflow-hidden px-2'>
          {rightSide.map((index) => {
            return (
              <SeedWord index={index} seedPhrase={seedPhrase} key={index} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function SeedWord(props: {
  index: number;
  seedPhrase: SeedPhrase;
  style?: StyleProp<ViewStyle>;
}) {
  const { index, seedPhrase, style } = props;
  return (
    <View
      className='flex flex-row items-center overflow-hidden'
      key={index}
      style={style}
    >
      <View className='w-6 flex-none'>
        <Text className='text-text-primary text-xs font-medium'>
          {index + 1}
        </Text>
      </View>
      <View className='border-card-highlight my-1 w-28 flex-1 border-b'>
        <Text className='text-text-secondary text-sm font-normal'>
          {seedPhrase[index]}
        </Text>
      </View>
    </View>
  );
}
