import otter from '../../../../assets/images/early-otter.svg';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Svg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';

interface EvolveSheetProps {
  isShowing: boolean;
  onClose: VoidFunction;
}

export function EvolveSheet(props: EvolveSheetProps) {
  const { isShowing, onClose } = props;

  return (
    <ActionSheet isShowing={isShowing} isDetached={true} onClose={onClose}>
      <ActionSheetHeader title='Evolve NFT' onClose={onClose} type='detached' />
      <View className='flex flex-col px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          Wow, you are so fast! Evolution of "The Nest" is still in the works.
          Here is something cute to look at in the meantime.
        </Text>
        <View className='mb-2 mt-2 w-full items-center'>
          <Svg source={otter} height={100} width={100} />
        </View>
        <View className='pt-4'>
          <TextButton text='Close' onPress={onClose} />
        </View>
      </View>
    </ActionSheet>
  );
}
