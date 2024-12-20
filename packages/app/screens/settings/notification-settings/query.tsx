import { useCallback } from 'react';
import { useFetchData } from '../../../common/hooks/graphql';
import { useLoadFunction } from '../../../common/hooks/loading';
import { Loadable, VoidPromiseFunction } from '../../../common/types';
import { tuple } from '../../../common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  onLoadable,
} from '../../../common/utils/query';
import { Skeleton } from '../../../components/skeleton';
import { View } from '../../../components/view';
import {
  INotificationSetting,
  INotificationSettingsQuery,
  INotificationSettingsQueryVariables,
  IUserSession,
  NotificationSettingsDocument,
  useSessionQuery,
} from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';
import { NotificationSettingsScreen } from './screen';

// Note: we need this because we want the notification switches to be accurate, and when using the cache to set the initial state
// they can have the old version which is wrong. Also, cacheTime: 0 does not guarantee the query to ignore the cache in useQuery
function useLoadNotificationSettings() {
  const fetchData = useFetchData<
    INotificationSettingsQuery,
    INotificationSettingsQueryVariables
  >(NotificationSettingsDocument);
  const fetchSettings = useCallback(async () => {
    const settings = await fetchData();
    return settings.notificationSettings as INotificationSetting[];
  }, []);
  return useLoadFunction(fetchSettings);
}

interface NotificationSettingsQueryProps {
  deviceId: Loadable<string | null>;
  devicePermission: Loadable<boolean>;
  onChangePushNotification: (enabled: boolean) => Promise<void>;
  onEnableDeviceNotifications: (deviceId: string) => Promise<void>;
  onOpenSettings: VoidPromiseFunction;
}

export function NotificationSettingsWithQuery(
  props: NotificationSettingsQueryProps,
) {
  const {
    deviceId,
    devicePermission,
    onChangePushNotification,
    onEnableDeviceNotifications,
    onOpenSettings,
  } = props;
  const { language } = useLanguageContext();

  const sessionQuery = useSessionQuery();
  const session = loadDataFromQuery(
    sessionQuery,
    (data) => data.session as IUserSession,
  );

  const { data: notificationSettings } = useLoadNotificationSettings();

  const handleEnableDeviceNotifications = async () => {
    if (deviceId.data) {
      await onEnableDeviceNotifications(deviceId.data);
      await sessionQuery.refetch();
    }
  };

  return onLoadable(
    composeLoadables(
      notificationSettings,
      session,
      deviceId,
      devicePermission,
    )(tuple),
  )(
    () => (
      <View className='flex flex-col space-y-2 px-4'>
        <Skeleton height={48} width={'100%'} borderRadius={12} />
        <Skeleton height={120} width={'100%'} borderRadius={16} />
        <Skeleton height={48} width={'100%'} borderRadius={12} />
      </View>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetSettings[language]}
        description={localization.unableToGetSettingsDescription[language]}
      />
    ),
    ([settings, session, deviceId, permission]) => (
      <NotificationSettingsScreen
        session={session}
        deviceId={deviceId}
        devicePermission={permission}
        settings={settings}
        onChangePushNotification={onChangePushNotification}
        onEnableDeviceNotifications={handleEnableDeviceNotifications}
        onOpenSettings={onOpenSettings}
      />
    ),
  );
}
