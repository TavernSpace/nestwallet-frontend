import { faCheck, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { adjust, withSize } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ActionSheet } from '../../../components/sheet';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';

export function SyncSheet(props: {
  isShowing: boolean;
  isSyncing: boolean;
  error?: string;
  onClose: VoidFunction;
}) {
  const { isShowing, isSyncing, error, onClose } = props;

  const size = adjust(36);
  const iconSize = adjust(24, 2);

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title='Syncing Wallet'
        onClose={onClose}
        type='detached'
      />
      {isSyncing && !error && (
        <View className='flex flex-col items-center justify-center space-y-4 px-4 pt-4'>
          <ActivityIndicator size={size} />
          <Text className='text-text-secondary text-sm font-normal'>
            Syncing your wallet. This will only take a few moments...
          </Text>
        </View>
      )}
      {!isSyncing && !error && (
        <View className='flex flex-col items-center justify-center space-y-2 px-4 pt-4'>
          <View
            className='bg-success/10 items-center justify-center rounded-full'
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faCheck}
              color={colors.success}
              size={iconSize}
            />
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            Syncing complete!
          </Text>
          <View className='w-full pt-8'>
            <TextButton text='Back' onPress={onClose} />
          </View>
        </View>
      )}
      {error && (
        <View className='flex flex-col items-center justify-center space-y-2 px-4 pt-4'>
          <View
            className='bg-failure/10 items-center justify-center rounded-full'
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faTimes}
              color={colors.failure}
              size={iconSize}
            />
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            Sync failed, please try again later
          </Text>
          <View className='w-full pt-8'>
            <TextButton text='Back' onPress={onClose} />
          </View>
        </View>
      )}
    </ActionSheet>
  );
}
