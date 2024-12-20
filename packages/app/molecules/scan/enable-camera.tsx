import { TextButton } from '../../components/button/text-button';
import { NestLight } from '../../components/logo/nest';
import { ScanBorder } from '../../components/scan';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors, SCREEN_WIDTH } from '../../design/constants';

interface EnableCameraProps {
  onLater: VoidFunction;
  onEnable: VoidFunction;
}

export function EnableCamera(props: EnableCameraProps) {
  const { onEnable, onLater } = props;

  return (
    <View className='flex flex-1 justify-between px-4'>
      <View className='flex flex-col items-center'>
        <View
          className='bg-card mt-8 flex flex-col items-center justify-center shadow'
          style={{
            width: SCREEN_WIDTH - 80,
            height: SCREEN_WIDTH - 80,
            borderRadius: 64,
          }}
        >
          <NestLight size={SCREEN_WIDTH - 240} rounded={false} />
          <ScanBorder
            size={SCREEN_WIDTH - 180}
            length={40}
            thickness={4}
            color={colors.textSecondary}
            radius={64}
          />
        </View>
        <View className='flex flex-col space-y-3 pt-6'>
          <Text className='text-text-primary text-center text-lg font-medium'>
            {'Enable Camera'}
          </Text>

          <View className='bg-card rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {'Scan QR codes to connect to dApps and quickly copy addresses.'}
            </Text>
          </View>
        </View>
      </View>
      <View className='flex w-full flex-row items-center space-x-4'>
        <TextButton
          className='flex-1'
          type='tertiary'
          text='Maybe Later'
          onPress={onLater}
        />
        <TextButton className='flex-1' text='Enable' onPress={onEnable} />
      </View>
    </View>
  );
}
