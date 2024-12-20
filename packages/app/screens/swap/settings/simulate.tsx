import { Checkbox } from '../../../components/checkbox';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';

export interface SimulateSectionProps {
  simulate: boolean;
  onSimulateToggle: (simulate: boolean) => Promise<void>;
}

export function SimulateSection(props: SimulateSectionProps) {
  const { simulate, onSimulateToggle } = props;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'Simulate Transaction'}
      </Text>
      <View className='bg-card flex flex-col space-y-3 rounded-xl px-4 py-3'>
        <View className='flex flex-row items-center justify-between '>
          <Text className='text-text-primary text-sm font-medium'>
            {'Enabled'}
          </Text>
          <Checkbox
            selected={simulate}
            onPress={() => onSimulateToggle(!simulate)}
          />
        </View>
        <View className='bg-card-highlight h-[1px]' />
        <Text className='text-text-secondary text-xs font-normal'>
          {
            'Simulation helps catch errors in your transaction before submitting, but can have false positives or slow down your submission.'
          }
        </Text>
      </View>
    </View>
  );
}
