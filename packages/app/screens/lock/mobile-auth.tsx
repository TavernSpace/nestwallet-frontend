import { faLock, faRightFromBracket } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { VoidPromiseFunction } from '../../common/types';
import { withSize } from '../../common/utils/style';
import { UserAvatar } from '../../components/avatar/user-avatar';
import { IconButton } from '../../components/button/icon-button';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { NestLight } from '../../components/logo/nest';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { parseError } from '../../features/errors';
import { useSafeAreaInsets } from '../../features/safe-area';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { localization } from './localization';
import { LockErrorSheet } from './lock-error';

export function MobileLockScreen(props: {
  identity: string;
  unlocking: boolean;
  onUnlock: VoidPromiseFunction;
  onReset: VoidPromiseFunction;
  onLogout: VoidPromiseFunction;
}) {
  const { identity, unlocking, onReset, onUnlock, onLogout } = props;
  const { showSnackbar } = useSnackbar();
  const { top, bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();

  const [showResetSheet, setShowResetSheet] = useState(false);

  const handleUnlock = async () => {
    try {
      await onUnlock();
      setShowResetSheet(false);
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleReset = async () => {
    try {
      await onReset();
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.unableToResetDevice[language],
      });
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      setShowResetSheet(false);
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.unableToLogout[language],
      });
    }
  };

  return (
    <View
      className='bg-background absolute flex h-full w-full flex-col items-center justify-between'
      style={{ paddingBottom: Math.max(bottom, 16), paddingTop: top }}
    >
      <View className='bg-card flex flex-row items-center space-x-2 rounded-full px-4 py-3'>
        <UserAvatar size={24} />
        <Text
          className='text-text-primary max-w-[75%] truncate text-sm font-medium'
          numberOfLines={1}
        >
          {identity}
        </Text>
        <IconButton
          icon={faRightFromBracket}
          size={16}
          color={colors.failure}
          onPress={handleLogout}
        />
      </View>
      <View className='flex w-full flex-col px-4'>
        <View className='bg-card border-card-highlight w-full space-y-8 rounded-[36px] border px-3 py-6'>
          <View className='flex flex-col items-center justify-center'>
            <View
              className='bg-primary/10 items-center justify-center rounded-full'
              style={withSize(80)}
            >
              <FontAwesomeIcon icon={faLock} color={colors.primary} size={48} />
            </View>
            <View className='flex flex-col items-center justify-center pt-4'>
              <Text
                className='text-text-primary truncate text-base font-medium'
                numberOfLines={1}
              >
                {localization.welcomeBack[language]}
              </Text>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.authenticateYourself[language]}
              </Text>
              <View className='flex flex-row items-center space-x-1'>
                <NestLight size={20} rounded={true} />
                <Text className='text-primary text-sm font-medium'>
                  {localization.nestWallet[language]}
                </Text>
              </View>
            </View>
          </View>
          <View className='w-full px-4'>
            <TextButton
              text={localization.unlock[language]}
              loading={unlocking}
              disabled={unlocking}
              disabledColor={colors.cardHighlight}
              onPress={handleUnlock}
            />
          </View>
        </View>
      </View>
      <View className='h-9'>
        <Text
          className='text-text-secondary text-xs font-normal underline'
          onPress={() => setShowResetSheet(true)}
        >
          {localization.troubleAccessingWallet[language]}
        </Text>
      </View>
      <LockErrorSheet
        isShowing={showResetSheet}
        onClose={() => setShowResetSheet(false)}
        onReset={handleReset}
      />
    </View>
  );
}
