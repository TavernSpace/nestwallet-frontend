import { Checkbox } from '../../../components/checkbox';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';

export interface MevSectionProps {
  mev: boolean;
  disabled: boolean;
  onMevToggle: (mev: boolean) => Promise<void>;
}

export function MevSection(props: MevSectionProps) {
  const { mev, disabled, onMevToggle } = props;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'MEV Protection'}
      </Text>
      <View
        className='bg-card flex flex-col space-y-3 rounded-xl px-4 py-3'
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <View className='flex flex-row items-center justify-between '>
          <Text className='text-text-primary text-sm font-medium'>
            {'Enabled'}
          </Text>
          <Checkbox selected={mev} onPress={() => onMevToggle(!mev)} />
        </View>
        <View className='bg-card-highlight h-[1px]' />
        <Text className='text-text-secondary text-xs font-normal'>
          {
            'MEV protected transactions are prevent frontrunning but may take longer to execute.'
          }
        </Text>
      </View>
    </View>
  );
}
