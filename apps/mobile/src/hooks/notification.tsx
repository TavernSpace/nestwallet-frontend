import { useEffectOnSuccess } from '@nestwallet/app/common/hooks/loading';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { Loadable, Nullable } from '@nestwallet/app/common/types';
import { id } from '@nestwallet/app/common/utils/functions';
import {
  IEntityType,
  INotificationType,
  IUser,
  useMarkNotificationAsReadMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

interface INotificationData {
  id: string;
  type: INotificationType;
  associatedEntityType: IEntityType;
  associatedEntityId: string;
  deepLinkId: string;
  walletId: string;
  organizationId: string;
  userId: string;
  totalCount: string;
}

type NotificationHandler = (
  notification: Nullable<INotificationData>,
) => Promise<void>;

class NotificationController {
  private static handlers: NotificationHandler[] = [];
  private static unsubscribeForegroundOnMessage: VoidFunction = () => {};
  private static unsubscribeForegroundActiveHandler: Notifications.Subscription;
  private static unsubscribeBackgroundHandler: VoidFunction = () => {};

  private constructor() {}

  public static initialize() {
    this.registerForegroundMessageListener();
    this.registerActiveHandler();
    this.registerBackgroundHandler();
  }

  public static setHandler(newHandler: NotificationHandler) {
    if (!this.handlers.find((handler) => handler === newHandler)) {
      this.handlers.push(newHandler);
      this.registerQuitHandler();
    }
    return newHandler;
  }

  public static removeHandler(handlerToRemove: NotificationHandler) {
    this.handlers = this.handlers.filter(
      (handler) => handler !== handlerToRemove,
    );
  }

  public static cleanup() {
    this.handlers = [];
    this.unsubscribeForegroundOnMessage();
    Notifications.removeNotificationSubscription(
      this.unsubscribeForegroundActiveHandler,
    );
    this.unsubscribeBackgroundHandler();
  }

  private static handleNotification(notification: Nullable<INotificationData>) {
    if (this.handlers.length > 0) {
      const handler = this.handlers[this.handlers.length - 1]!;
      handler(notification);
    }
  }

  private static registerQuitHandler() {
    // we don't want to register until we have at least one handler otherwise clicking the notification does nothing and is consumed
    if (this.handlers.length > 0) {
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            this.handleNotification(
              remoteMessage.data as Nullable<INotificationData>,
            );
          }
        });
    }
  }

  // TODO: handle case where user is logged out and clicks a notification,
  // should deeplink them after user is logged in
  private static registerBackgroundHandler() {
    this.unsubscribeBackgroundHandler = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        this.handleNotification(
          remoteMessage.data as Nullable<INotificationData>,
        );
      },
    );
  }

  // TODO: handle case where user is logged out and clicks a notification,
  // should deeplink them after user is logged in
  private static registerActiveHandler() {
    this.unsubscribeForegroundActiveHandler =
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotification(
          response.notification.request.content.data as INotificationData,
        );
      });
  }

  private static registerForegroundMessageListener() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Note: this is necessary to prevent android from showing data notifications in the foreground
        const dataOnly =
          !notification.request.content.title &&
          !notification.request.content.body;
        return {
          shouldShowAlert: !dataOnly,
          shouldPlaySound: !dataOnly,
          shouldSetBadge: !dataOnly,
        };
      },
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // TODO: when the user gets a notification when on the login screen after logging in they are not redirected,
    // find a way to add this or maybe disable notifications on login screen?
    this.unsubscribeForegroundOnMessage = messaging().onMessage(
      async (remoteMessage) => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          },
          trigger: null,
        });
      },
    );
  }
}

export function useInitializeNotifications() {
  useEffect(() => {
    NotificationController.initialize();
    return () => {
      NotificationController.cleanup();
    };
  }, []);
}

export function useNotification(userLoadable: Loadable<IUser | null>) {
  const navigation = useNavigation();

  const markNotificationAsReadMutation = useMutationEmitter(
    graphqlType.Notification,
    useMarkNotificationAsReadMutation(),
  );

  useEffectOnSuccess(userLoadable, (user) => {
    const handleNotification = async (
      notification: Nullable<INotificationData>,
    ) => {
      // This is to prevent edge cases for when the user changes
      if (!notification || !user || notification.userId !== user.id) {
        return;
      }
      // Don't await since we want to redirect immediately, if the call fails it is no big deal
      markNotificationAsReadMutation
        .mutateAsync({
          id: notification.id,
        })
        .catch(id);
      if (
        notification.type === INotificationType.ProposalCreated ||
        notification.type === INotificationType.ProposalSigned ||
        notification.type === INotificationType.ProposalExecuted
      ) {
        navigation.navigate('app', {
          screen: 'transactionProposal',
          params: {
            proposalId: notification.deepLinkId,
            walletId: notification.walletId,
          },
        });
      } else if (
        notification.type === INotificationType.MessageProposalCreated ||
        notification.type === INotificationType.MessageProposalSigned
      ) {
        navigation.navigate('app', {
          screen: 'messageProposal',
          params: {
            messageId: notification.deepLinkId,
            walletId: notification.walletId,
          },
        });
      } else if (
        notification.type === INotificationType.ReceivedEther ||
        notification.type === INotificationType.ReceivedErc20 ||
        notification.type === INotificationType.ReceivedErc721
      ) {
        navigation.navigate('app', {
          screen: 'transaction',
          params: {
            transaction: notification.deepLinkId,
            walletId: notification.walletId,
          },
        });
      } else {
        navigation.navigate('app', {
          screen: 'walletDetails',
        });
      }
    };
    const handler = NotificationController.setHandler(handleNotification);
    return () => {
      NotificationController.removeHandler(handler);
    };
  });
}
