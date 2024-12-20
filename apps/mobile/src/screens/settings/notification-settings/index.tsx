import {
  loadDataFromQuery,
  mapLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  INotificationSettingScope,
  INotificationSettingType,
  useUpsertNotificationSettingMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { NotificationSettingsWithQuery } from '@nestwallet/app/screens/settings/notification-settings/query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import {
  useDeviceIdQuery,
  useDeviceNotificationPermissions,
} from '../../../hooks/device';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'notificationSettings'
>;

export const NotificationSettingsWithData = withUserContext(
  _NotificationSettingsWithData,
);

function _NotificationSettingsWithData({ route }: RouteProps) {
  const { userService } = useAppContext();
  const { user } = useUserContext();
  const { toggleAutoLock } = useLockContext();
  const { apiClient } = useNestWallet();

  const upsertNotificationSettingMutation =
    useUpsertNotificationSettingMutation();

  const deviceIdQuery = useDeviceIdQuery();
  const deviceId = loadDataFromQuery(deviceIdQuery);

  const deviceNotificationPermissionsQuery = useDeviceNotificationPermissions();
  const deviceNotificationPermissions = loadDataFromQuery(
    deviceNotificationPermissionsQuery,
  );

  const handleChangePushNotification = async (enabled: boolean) => {
    await upsertNotificationSettingMutation.mutateAsync({
      input: {
        enabled,
        scopeId: user.id,
        scopeType: INotificationSettingScope.User,
        settingType: INotificationSettingType.Push,
      },
    });
  };

  const handleUpdateDevice = async (deviceId: string) => {
    if (deviceId) {
      await apiClient.updateDevice({ deviceId });
    }
  };

  const handleOpenSettings = async () => {
    if (!deviceNotificationPermissions.success || !deviceId.success) {
      throw new Error('Unable to get settings, please try again');
    } else if (
      deviceNotificationPermissions.data.canAskAgain &&
      !deviceNotificationPermissions.data.granted
    ) {
      if (Platform.OS === 'android') {
        toggleAutoLock(false);
      }
      await userService.requestNotificationPermission();
      if (Platform.OS === 'android') {
        toggleAutoLock(true);
      }
    } else {
      await Linking.openSettings();
    }
  };

  useEffect(() => {
    return () => {
      if (Platform.OS === 'android') {
        toggleAutoLock(true);
      }
    };
  }, []);

  return (
    <NotificationSettingsWithQuery
      deviceId={deviceId}
      devicePermission={mapLoadable(deviceNotificationPermissions)(
        (data) => data.granted,
      )}
      onChangePushNotification={handleChangePushNotification}
      onEnableDeviceNotifications={handleUpdateDevice}
      onOpenSettings={handleOpenSettings}
    />
  );
}
