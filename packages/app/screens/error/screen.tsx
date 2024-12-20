import { faBug } from '@fortawesome/pro-solid-svg-icons';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ScrollView } from '../../components/scroll';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { parseError } from '../../features/errors';
import { useSafeAreaInsets } from '../../features/safe-area';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './localization';

interface ErrorScreenProps {
  error: unknown;
  onPress: VoidFunction;
  language: ILanguageCode;
}

export function ErrorScreen(props: ErrorScreenProps) {
  const { error, onPress, language } = props;
  const { top, bottom } = useSafeAreaInsets();

  const appError = parseError(error, localization.defaultError[language]);

  // Note: we can't use ViewWithInsets here since we're not in a navigator
  return (
    <View className='bg-background absolute h-full w-full overflow-hidden'>
      <View
        className='flex h-full w-full flex-col justify-between'
        style={{ paddingTop: top + 48 }}
      >
        <ScrollView
          className='h-full w-full'
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex h-full w-full flex-col items-center justify-center space-y-12 px-4 pb-4'>
            <View className='flex w-full flex-col items-center justify-center'>
              <View className='bg-failure/10 h-20 w-20 items-center justify-center rounded-full'>
                <FontAwesomeIcon
                  icon={faBug}
                  color={colors.failure}
                  size={48}
                />
              </View>
              <Text className='text-text-primary mt-8 text-xl font-bold'>
                {localization.somethingWrong[language]}
              </Text>
              <Text className='text-text-secondary mt-2 text-center text-sm font-normal'>
                {localization.unexpectedError[language]}
              </Text>
            </View>
            <View className='flex w-full flex-col space-y-2 px-4'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.error[language]}
              </Text>
              <View className='bg-card w-full rounded-xl px-4 py-2'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {appError.message}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <View className='px-4' style={{ paddingBottom: bottom }}>
          <TextButton text={localization.goHome[language]} onPress={onPress} />
        </View>
      </View>
    </View>
  );
}
