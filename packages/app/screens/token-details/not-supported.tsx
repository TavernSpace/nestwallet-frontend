import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { View } from '../../components/view';

export function NotSupportedSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
}) {
  const { isShowing, onClose } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title='Action not Supported'
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {'This action is not supported on this chain yet.'}
        </Text>
      </View>
    </ActionSheet>
  );
}
