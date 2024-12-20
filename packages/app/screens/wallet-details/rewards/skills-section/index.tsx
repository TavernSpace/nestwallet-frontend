import { useState } from 'react';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { BoostSection } from './boost';
import { GasSection } from './gas';
import { XpSection } from './xp';

export function SkillsSection() {
  const [tab, setTab] = useState<'gas' | 'boost' | 'xp'>('gas');

  return (
    <View className='h-full w-full justify-start p-2'>
      <View className='flex flex-row justify-between py-3'>
        <View className='flex flex-row'>
          {/* <FilterTab
            name='Gas'
            selected={tab === 'gas'}
            onPress={() => setTab('gas')}
          />
          <FilterTab
            name='Boost'
            selected={tab === 'boost'}
            onPress={() => setTab('boost')}
          />
          <FilterTab
            name='Xp'
            selected={tab === 'xp'}
            onPress={() => setTab('xp')}
          /> */}
        </View>
        <View className='bg-card flex flex-row items-center justify-center rounded-2xl px-4'>
          {/* for now we hardcode the points to zero */}
          <Text className='text-text-secondary text-sm font-medium'>
            {'0 points'}
          </Text>
        </View>
      </View>
      {tab === 'gas' ? (
        <GasSection />
      ) : tab === 'boost' ? (
        <BoostSection />
      ) : (
        <XpSection />
      )}
    </View>
  );
}
