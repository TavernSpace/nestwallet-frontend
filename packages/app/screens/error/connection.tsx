import { faSignalSlash } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Loadable, VoidPromiseFunction } from '../../common/types';
import { onLoadable } from '../../common/utils/query';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './localization';

// Note: we need to manually pass in language here instead of using the context
// since this screen is under the User language context but we need the local language
// (since the user is not loaded yet at this stage)
export function ConnectionErrorScreen(props: {
  language: Loadable<ILanguageCode>;
  onRetry: VoidPromiseFunction;
}) {
  const { language, onRetry } = props;

  return onLoadable(language)(
    () => null,
    () => (
      <ConnectionErrorWithLanguage
        language={ILanguageCode.En}
        onRetry={onRetry}
      />
    ),
    (language) => (
      <ConnectionErrorWithLanguage language={language} onRetry={onRetry} />
    ),
  );
}

function ConnectionErrorWithLanguage(props: {
  language: ILanguageCode;
  onRetry: VoidPromiseFunction;
}) {
  const { language, onRetry } = props;
  const { bottom } = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    try {
      setLoading(true);
      await onRetry();
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='bg-background flex h-full w-full flex-col items-center justify-between px-4'>
      <View className='h-4 w-4' />
      <View className='flex w-full flex-col items-center justify-center space-y-4'>
        <View className='bg-failure/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faSignalSlash}
            color={colors.failure}
            size={48}
          />
        </View>
        <Text className='text-text-primary text-lg font-medium'>
          {localization.serverConnectionError[language]}
        </Text>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.serverConnectionErrorDescription[language]}
          </Text>
        </View>
      </View>
      <View className='w-full' style={{ paddingBottom: bottom }}>
        <TextButton
          text={localization.retry[language]}
          onPress={handleRetry}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
}
