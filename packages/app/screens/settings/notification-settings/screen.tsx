import { faGear } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useState } from 'react';
import { Platform } from 'react-native';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Switch } from '../../../components/switch';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import {
  INotificationSetting,
  INotificationSettingScope,
  INotificationSettingType,
  IUserSession,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface NotificationSettingsProps {
  session: IUserSession;
  deviceId: string | null;
  devicePermission: boolean;
  settings: INotificationSetting[];
  onChangePushNotification: (enabled: boolean) => Promise<void>;
  onEnableDeviceNotifications: (deviceId: string) => Promise<void>;
  onOpenSettings: VoidPromiseFunction;
}

export function NotificationSettingsScreen(props: NotificationSettingsProps) {
  const {
    session,
    deviceId,
    devicePermission,
    settings,
    onChangePushNotification,
    onEnableDeviceNotifications,
    onOpenSettings,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(
    !!session.deviceId &&
      !settings.some(
        (setting) =>
          setting.settingType === INotificationSettingType.Push &&
          setting.scopeType === INotificationSettingScope.User &&
          !setting.enabled,
      ),
  );

  const handleChangePushNotification = async () => {
    try {
      setLoading(true);
      if (deviceId && session.deviceId !== deviceId && Platform.OS !== 'web') {
        await onEnableDeviceNotifications(deviceId);
      }
      await onChangePushNotification(enabled);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.updateSuccess[language],
      });
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.updateFailed[language],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await onOpenSettings();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.settingsFailed[language],
      });
    }
  };

  return (
    <ViewWithInset
      className='flex h-full w-full flex-col justify-between px-4'
      hasBottomInset={true}
    >
      <View className='flex flex-col space-y-2'>
        <View className='bg-card flex flex-row items-center justify-between space-x-2 rounded-xl px-4 py-3'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.pushNotifications[language]}
          </Text>
          <Switch value={enabled} onChange={() => setEnabled(!enabled)} />
        </View>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {`This will toggle notifications on this all devices associated with your account.${
              Platform.OS === 'web'
                ? ''
                : ' To disable notifications on this device only, go to your phone settings.'
            }`}
          </Text>
        </View>
        {Platform.OS !== 'web' && (
          <View className='bg-card flex flex-row items-center justify-between space-x-2 rounded-xl px-4 py-3'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.deviceNotifications[language]}
            </Text>
            <View className='flex flex-row items-center justify-between space-x-2'>
              <View
                className={cn('rounded-full px-2 py-1', {
                  'bg-success/10': devicePermission,
                  'bg-failure/10': !devicePermission,
                })}
              >
                <Text
                  className={cn('text-xs font-medium', {
                    'text-success': devicePermission,
                    'text-failure': !devicePermission,
                  })}
                >
                  {devicePermission
                    ? localization.enabled[language]
                    : localization.disabled[language]}
                </Text>
              </View>
              <BaseButton onPress={handleOpenSettings}>
                <View className='bg-card-highlight h-8 w-8 items-center justify-center rounded-lg'>
                  <FontAwesomeIcon
                    icon={faGear}
                    size={adjust(18, 2)}
                    color={colors.textSecondary}
                  />
                </View>
              </BaseButton>
            </View>
          </View>
        )}
      </View>
      <View className='flex flex-col space-y-2'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {
              'Nest Wallet sends you notifications to alert you of prices changes of your positions, limit orders, and more.'
            }
          </Text>
        </View>
        <TextButton
          text='Save'
          loading={loading}
          disabled={loading}
          onPress={handleChangePushNotification}
        />
      </View>
    </ViewWithInset>
  );
}
