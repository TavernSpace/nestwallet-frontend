import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { empty } from '@nestwallet/app/common/utils/functions';
import {
  resolveMessageProposal,
  resolveTransactionProposal,
} from '@nestwallet/app/features/proposal/utils';
import {
  INotification,
  INotificationType,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { NotificationsWithQuery } from '@nestwallet/app/screens/notifications/query';
import { StackScreenProps } from '@react-navigation/stack';
import { AppStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'notifications'>;

export const NotificationsWithData = withUserContext(_NotificationsWithData);

function _NotificationsWithData({ route, navigation }: RouteProps) {
  const { refetch } = useUserContext();

  const markNotificationAsReadMutation = useMutationEmitter(
    graphqlType.Notification,
    useMarkNotificationAsReadMutation(),
  );
  const markAllNotificationsAsReadMutation = useMutationEmitter(
    graphqlType.Notification,
    useMarkAllNotificationsAsReadMutation(),
  );

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadMutation.mutateAsync({});
  };

  const handleOnNotificationsPressed = async (notification: INotification) => {
    if (
      notification.type === INotificationType.ProposalCreated ||
      notification.type === INotificationType.ProposalSigned ||
      notification.type === INotificationType.ProposalExecuted
    ) {
      const transactionProposal = resolveTransactionProposal(
        notification.transactionProposalEntity!,
      );
      navigation.navigate('transactionProposal', {
        proposalId: notification.associatedEntityId,
        walletId: transactionProposal.wallet.id,
      });
    } else if (
      notification.type === INotificationType.MessageProposalCreated ||
      notification.type === INotificationType.MessageProposalSigned
    ) {
      const messageProposal = resolveMessageProposal(
        notification.messageProposalEntity!,
      );
      navigation.navigate('messageProposal', {
        messageId: notification.associatedEntityId,
        walletId: messageProposal.wallet.id,
      });
    } else if (
      notification.type === INotificationType.ReceivedEther ||
      notification.type === INotificationType.ReceivedErc20 ||
      notification.type === INotificationType.ReceivedErc721
    ) {
      navigation.navigate('transaction', {
        transaction: (notification.receivedEtherMetadata?.transaction ||
          notification.receivedERC20Metadata?.transaction ||
          notification.receivedERC721Metadata?.transaction)!,
        walletId: notification.associatedEntityId,
      });
    }
    if (!notification.isRead) {
      await markNotificationAsReadMutation
        .mutateAsync({
          id: notification.id,
        })
        .catch(empty);
    }
  };

  return (
    <NotificationsWithQuery
      onNotificationPress={handleOnNotificationsPressed}
      onMarkAllAsRead={handleMarkAllAsRead}
      refetchUser={refetch}
    />
  );
}
