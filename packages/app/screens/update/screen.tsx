import { faArrowUpFromArc } from '@fortawesome/pro-solid-svg-icons';
import { Linking, Platform } from 'react-native';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';

export function ForceUpdateScreen() {
  const { top, bottom } = useSafeAreaInsets();

  const handleOpenAppStore = async () => {
    const googlePlayStoreLink = 'market://details?id=xyz.nestwallet.nestwallet';
    const appleAppStoreLink =
      'itms-apps://itunes.apple.com/us/app/apple-store/id6451122334?mt=8';
    const link =
      Platform.OS === 'ios' ? appleAppStoreLink : googlePlayStoreLink;
    await Linking.openURL(link);
  };

  // Note we can't use ViewWithInsets here since we're not in a navigator
  return (
    <View className='bg-background absolute h-full w-full overflow-hidden'>
      <View
        className='flex h-full w-full flex-col justify-between'
        style={{ paddingTop: top + 48 }}
      >
        <View />
        <View className='flex flex-col items-center justify-center space-y-12 px-4 pb-4'>
          <View className='flex w-full flex-col items-center justify-center space-y-4'>
            <View className='bg-failure/10 h-20 w-20 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faArrowUpFromArc}
                color={colors.failure}
                size={48}
              />
            </View>
            <Text className='text-text-primary text-lg font-medium'>
              Nest Wallet is out of date
            </Text>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                Please update your app for the latest features and improvements.
              </Text>
            </View>
          </View>
        </View>
        <View className='px-4' style={{ paddingBottom: bottom }}>
          <TextButton text='Update App' onPress={handleOpenAppStore} />
        </View>
      </View>
    </View>
  );
}
