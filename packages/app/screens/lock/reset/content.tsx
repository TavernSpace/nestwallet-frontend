import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Platform } from 'react-native';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { IconButton } from '../../../components/button/icon-button';
import { TextButton } from '../../../components/button/text-button';
import { Checkbox } from '../../../components/checkbox';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface PasswordResetSheetProps {
  onClose: VoidFunction;
  onBack?: VoidFunction;
  onSubmit: VoidPromiseFunction;
}

export function PasswordResetContent(props: PasswordResetSheetProps) {
  const { onClose, onBack, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorResettingPassword[language],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='flex flex-col justify-between'>
      <View className='flex flex-col'>
        <ActionSheetHeader
          adornment={
            <View className='-ml-1'>
              <IconButton
                icon={faChevronLeft}
                size={20}
                color={colors.textSecondary}
                onPress={Platform.OS === 'web' ? onClose : onBack}
              />
            </View>
          }
          onClose={Platform.OS === 'web' ? undefined : onClose}
          type='detached'
        />
        <View
          className='flex flex-col items-center justify-center'
          style={{ paddingHorizontal: adjust(16, 8) }}
        >
          <View className='bg-failure/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              color={colors.failure}
              size={48}
            />
          </View>
          <View className='flex flex-col space-y-2 pt-4'>
            <Text className='text-text-primary text-center text-base font-medium'>
              {
                localization.resetDeviceOrPassword(
                  Platform.OS !== 'web'
                    ? localization.device[language]
                    : localization.password[language],
                )[language]
              }
            </Text>
            <Text className='text-text-secondary text-center text-sm font-normal'>
              <Text className='text-failure'>
                {localization.irreversibleAction[language]}
              </Text>
              {localization.willNeedToReimport[language]}
            </Text>
          </View>
        </View>
      </View>
      <View
        className='flex flex-col space-y-2'
        style={{
          paddingHorizontal: adjust(16, 8),
          paddingTop: Platform.OS === 'web' ? undefined : 16,
        }}
      >
        <View className='flex flex-row items-center space-x-2'>
          <View className='bg-card flex flex-1 flex-row items-center rounded-2xl px-4 py-4'>
            <Text className='text-text-secondary text-xs font-normal'>
              {
                localization.confirmResetDeviceOrPassword(
                  Platform.OS !== 'web'
                    ? localization.device[language]
                    : localization.password[language],
                )[language]
              }
            </Text>
          </View>
          <Checkbox selected={checked} onPress={() => setChecked(!checked)} />
        </View>
        <View className='flex flex-row space-x-4'>
          <TextButton
            className='flex-1'
            text={localization.cancel[language]}
            type='tertiary'
            buttonColor={colors.failure}
            disabled={loading}
            onPress={onClose}
          />
          <TextButton
            className='flex-1'
            text={localization.reset[language]}
            buttonColor={colors.failure}
            loading={loading}
            disabled={loading || !checked}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </View>
  );
}
