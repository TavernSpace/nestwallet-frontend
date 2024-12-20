import EmptyNotifications from '../../assets/images/empty-notifications.svg';
import { Svg } from '../../components/svg';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

export const NotificationsEmptyState = () => {
  const { language } = useLanguageContext();

  return (
    <View className='flex h-full w-full flex-col items-center justify-center overflow-hidden'>
      <View className='flex w-full flex-col items-center space-y-2'>
        <Svg source={EmptyNotifications} width={88} height={72} />
        <Text className='text-text-primary pt-4 text-center text-xl font-medium'>
          {localization.noNotificationsYet[language]}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {localization.willBeNotified[language]}
        </Text>
      </View>
    </View>
  );
};
