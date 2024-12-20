import { useLoadFunction } from '@nestwallet/app/common/hooks/loading';
import messaging from '@react-native-firebase/messaging';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { getLocalLanguage } from '../common/service/storage';
import { useAppContext } from '../provider/application';

export function useDeviceNotificationPermissions() {
  return useQuery({
    queryKey: ['queryDeviceNotificationPermission'],
    queryFn: () => Notifications.getPermissionsAsync(),
  });
}

export function useDeviceIdQuery() {
  return useQuery({
    queryKey: ['queryDeviceId'],
    queryFn: () => messaging().getToken(),
  });
}

export function useAutoLockTimeQuery() {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryAutoLockTime'],
    queryFn: () => walletService.getAutoLockTime(),
  });
}

export function useLocalLanguage() {
  return useLoadFunction(getLocalLanguage);
}
