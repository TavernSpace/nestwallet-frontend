import { faBookOpenReader } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { minTime } from '../../common/api/utils';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { Loadable, VoidPromiseFunction } from '../../common/types';
import { onLoadable } from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { NeutralIconButton } from '../../components/button/icon-button';
import { RefreshButton } from '../../components/button/refresh-button';
import {
  FlatList,
  RenderItemProps,
} from '../../components/flashlist/flat-list';
import { QueueListItemSkeleton } from '../../components/skeleton/list-item';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { refreshHapticAsync } from '../../features/haptic';
import { INotification } from '../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../molecules/error/screen';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { NotificationsEmptyState } from './empty-state';
import { localization } from './localization';
import { NotificationItem } from './notification-item';

interface NotificationsScreenProps {
  notifications: Loadable<INotification[]>;
  onNotificationPress: (value: INotification) => void;
  onMarkAllAsRead: VoidPromiseFunction;
  refetchers?: VoidPromiseFunction[];
}

export function NotificationsScreen(props: NotificationsScreenProps) {
  const {
    notifications,
    onNotificationPress,
    onMarkAllAsRead,
    refetchers = [],
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await minTime(
        Promise.all(refetchers.map((refetcher) => refetcher())),
        500,
      );
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.failedToGetNofications[language],
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await onMarkAllAsRead();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.failedToMarkNofications[language],
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: RenderItemProps<INotification>) => (
      <NotificationItem
        key={item.id}
        notification={item}
        onPress={() => onNotificationPress(item)}
      />
    ),
    [],
  );

  // set navigation options
  useNavigationOptions({
    headerRight: () => (
      <View className='flex flex-row items-center space-x-2'>
        <NeutralIconButton
          icon={faBookOpenReader}
          loading={loading}
          onPress={handleMarkAllAsRead}
        />
        <RefreshButton refreshing={refreshing} onPress={handleRefresh} />
      </View>
    ),
  });

  return onLoadable(notifications)(
    () => (
      <View className='flex h-full flex-col'>
        <QueueListItemSkeleton />
        <QueueListItemSkeleton />
        <QueueListItemSkeleton />
      </View>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetNotifications[language]}
        description={localization.unableToGetNotificationsDescription[language]}
      />
    ),
    (data) =>
      data.length === 0 ? (
        <NotificationsEmptyState />
      ) : (
        <View className='absolute h-full w-full'>
          <FlatList
            data={data}
            estimatedItemSize={adjust(64)}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                progressBackgroundColor={colors.cardHighlight}
                tintColor={colors.primary}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        </View>
      ),
  );
}
