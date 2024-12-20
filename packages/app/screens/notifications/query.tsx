import { useQueryRefetcher } from '../../common/hooks/query';
import { VoidPromiseFunction } from '../../common/types';
import { withDiscardedAsyncResult } from '../../common/utils/functions';
import { loadDataFromQuery } from '../../common/utils/query';
import {
  INotification,
  useNotificationsQuery,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';
import { NotificationsScreen } from './screen';

interface NotificationsQueryProps {
  onNotificationPress: (value: INotification) => void;
  onMarkAllAsRead: VoidPromiseFunction;
  refetchUser: VoidPromiseFunction;
}

export function NotificationsWithQuery(props: NotificationsQueryProps) {
  const { onNotificationPress, onMarkAllAsRead, refetchUser } = props;

  const notificationsQuery = useQueryRefetcher(
    [graphqlType.Notification],
    useNotificationsQuery({
      filter: undefined,
      limit: 100,
    }),
  );

  const notifications = loadDataFromQuery(notificationsQuery, (data) =>
    data.notifications.edges.map((edge) => edge.node as INotification),
  );

  const refetchers = [
    withDiscardedAsyncResult(notificationsQuery.refetch),
    refetchUser,
  ];

  return (
    <NotificationsScreen
      notifications={notifications}
      onNotificationPress={onNotificationPress}
      onMarkAllAsRead={onMarkAllAsRead}
      refetchers={refetchers}
    />
  );
}
