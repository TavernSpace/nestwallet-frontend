import {
  loadDataFromQuery,
  makeLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  INotificationSettingScope,
  INotificationSettingType,
  useUpsertNotificationSettingMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { NotificationSettingsWithQuery } from '@nestwallet/app/screens/settings/notification-settings/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useDeviceIdQuery } from '../../../hooks/device';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  SettingsStackParamList,
  'notificationSettings'
>;

export const NotificationSettingsWithData = withUserContext(
  _NotificationSettingsWithData,
);

function _NotificationSettingsWithData({ route, navigation }: RouteProps) {
  const { user } = useUserContext();

  const upsertNotificationSettingMutation =
    useUpsertNotificationSettingMutation();

  const deviceIdQuery = useDeviceIdQuery();
  const deviceId = loadDataFromQuery(deviceIdQuery);

  const handleChangePushNotification = async (enabled: boolean) => {
    await upsertNotificationSettingMutation.mutateAsync({
      input: {
        enabled,
        scopeId: user.id,
        scopeType: INotificationSettingScope.User,
        settingType: INotificationSettingType.Push,
      },
    });
    navigation.goBack();
  };

  const handleUpdateDevice = async (deviceId: string) => {};

  const handleOpenSettings = async () => {};

  return (
    <NotificationSettingsWithQuery
      deviceId={deviceId}
      devicePermission={makeLoadable(true)}
      onChangePushNotification={handleChangePushNotification}
      onEnableDeviceNotifications={handleUpdateDevice}
      onOpenSettings={handleOpenSettings}
    />
  );
}
