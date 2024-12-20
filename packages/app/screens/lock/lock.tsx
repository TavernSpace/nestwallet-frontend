import { faLock } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { PasswordInput } from '../../components/text-input/password';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { localization } from './localization';

export function LockContent(props: {
  onUnlock: (password: string) => Promise<void>;
  onReset: VoidFunction;
}) {
  const { onUnlock, onReset } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onUnlock(password);
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.incorrectPassword[language],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='bg-background flex h-full w-full flex-col justify-between px-4'>
      <View className='mt-12 flex flex-col items-center justify-center'>
        <View className='flex flex-col items-center justify-center'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon icon={faLock} color={colors.primary} size={48} />
          </View>
          <View className='flex flex-col space-y-1 pt-4'>
            <Text className='text-text-primary text-center text-base font-medium'>
              {localization.welcomeBack[language]}
            </Text>
            <Text className='text-text-secondary text-center text-sm font-normal'>
              {localization.enterPassword[language]}
            </Text>
          </View>
        </View>
        <PasswordInput
          className='w-full pt-4'
          password={password}
          onPasswordChange={(password) => setPassword(password)}
          onSubmit={handleSubmit}
        />
        <View className='flex flex-row items-center justify-center space-x-1'>
          <Text className='text-text-secondary text-sm font-normal'>
            {localization.forgotYourPassword[language]}
          </Text>
          <TextButton
            type='transparent'
            text={localization.reset[language]}
            rippleEnabled={false}
            textStyle={{
              paddingVertical: 0,
              fontSize: 14,
              textDecorationLine: 'underline',
              color: colors.primary,
            }}
            onPress={onReset}
            disabled={loading}
            tabIndex={-1}
          />
        </View>
      </View>
      <TextButton
        text={localization.unlock[language]}
        loading={loading}
        disabled={loading}
        onPress={handleSubmit}
      />
    </View>
  );
}
