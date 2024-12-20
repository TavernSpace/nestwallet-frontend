import EmptyRewards from '../../../../assets/images/empty-rewards.svg';
import { CardEmptyState } from '../../../../components/card/card-empty-state';
import { View } from '../../../../components/view';

export function XpSection() {
  return (
    <View className='h-[70%] w-full justify-center'>
      <CardEmptyState
        icon={EmptyRewards}
        title='Coming Soon'
        description='Nest skills are coming soon. Stay tuned!'
      />
    </View>
  );
}
