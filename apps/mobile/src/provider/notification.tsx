import React from 'react';
import { useNotification } from '../hooks/notification';
import { useAuthorizedUserContext } from './user/auth';

export function NotificationProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const { user } = useAuthorizedUserContext();
  useNotification(user);
  return children;
}
