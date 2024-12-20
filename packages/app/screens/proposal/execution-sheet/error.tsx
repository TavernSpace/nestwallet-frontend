import { faExclamationCircle } from '@fortawesome/pro-solid-svg-icons';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface ExecutionSheetErrorContentProps {
  error: Error;
  onRetry: VoidFunction;
  onClose: VoidFunction;
}

export function ExecutionSheetErrorContent(
  props: ExecutionSheetErrorContentProps,
) {
  const { error, onRetry, onClose } = props;
  const { language } = useLanguageContext();
  const { message } = parseError(error, localization.defaultError[language]);

  return (
    <View className='flex h-full flex-col overflow-x-hidden px-4'>
      <View className='h-1/4' />
      <View className='flex flex-1 flex-col justify-between'>
        <View className='flex flex-col items-center justify-center'>
          <View className='bg-failure/20 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faExclamationCircle}
              color={colors.failure}
              size={48}
            />
          </View>
          <View className='flex flex-col items-center justify-center space-y-4 pt-6'>
            <Text className='text-text-primary text-lg font-medium'>
              {localization.failedToExecute[language]}
            </Text>
            <View className='bg-card flex flex-col space-y-2 rounded-2xl px-4 py-3'>
              <Text className='text-text-primary text-xs font-normal'>
                {localization.errorHeader[language]}
              </Text>
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={6}
              >
                {message}
              </Text>
            </View>
          </View>
        </View>
        <View className='flex flex-row space-x-4 pt-4'>
          <TextButton
            className='flex-1'
            onPress={onClose}
            type='tertiary'
            text={localization.cancel[language]}
          />
          <TextButton
            className='flex-1'
            onPress={onRetry}
            text={localization.retry[language]}
          />
        </View>
      </View>
    </View>
  );
}
