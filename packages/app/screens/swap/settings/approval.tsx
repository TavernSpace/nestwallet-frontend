import { Checkbox } from '../../../components/checkbox';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';

export interface ApprovalSectionProps {
  infiniteApproval: boolean;
  onInfiniteApprovalToggle: (infinite: boolean) => Promise<void>;
}

export function ApprovalSection(props: ApprovalSectionProps) {
  const { infiniteApproval, onInfiniteApprovalToggle } = props;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'Token Approvals'}
      </Text>
      <View className='bg-card flex flex-col space-y-3 rounded-xl px-4 py-3'>
        <View className='flex flex-row items-center justify-between'>
          <Text className='text-text-primary text-sm font-medium'>
            {'Approve Infinite'}
          </Text>
          <Checkbox
            selected={infiniteApproval}
            onPress={() => onInfiniteApprovalToggle(!infiniteApproval)}
          />
        </View>
        <View className='bg-card-highlight h-[1px]' />
        <Text className='text-text-secondary text-xs font-normal'>
          {`Infinite approvals means you won't need to approve the token you are sending again, but are less secure.`}
        </Text>
      </View>
    </View>
  );
}
