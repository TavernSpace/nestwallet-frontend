import {
  faDiamondExclamation,
  faExclamationCircle,
  faShieldCheck,
  faVideo,
} from '@fortawesome/pro-solid-svg-icons';
import { useSafeAreaInsets } from '@nestwallet/app/features/safe-area';
import { ISignerWallet } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { SecretType } from '../reveal-key/types';
import { secretTypeToLabel } from '../utils';

export function RevealKeyWarningScreen(props: {
  signer: ISignerWallet;
  onRevealPress: VoidFunction;
  secretType: SecretType;
}) {
  const { signer, onRevealPress, secretType } = props;
  const { bottom } = useSafeAreaInsets();

  const walletTypeLabel = secretTypeToLabel(secretType);
  const iconSize = adjust(20);
  const borderSize = adjust(36);

  return (
    <View
      className='flex h-full w-full flex-col justify-between space-y-8 px-4'
      style={{ paddingBottom: bottom || 16 }}
    >
      <View>
        <View className='items-center space-y-4'>
          <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faDiamondExclamation}
              className='text-primary'
              size={48}
            />
          </View>
          <Text className='text-text-primary text-lg font-bold'>
            Caution, Proceed Carefully
          </Text>
        </View>
        <View className='mt-8 flex flex-col space-y-6'>
          <View className='flex flex-row items-center justify-start space-x-4'>
            <View
              className='bg-success/10 flex flex-none items-center justify-center rounded-full'
              style={withSize(borderSize)}
            >
              <FontAwesomeIcon
                icon={faShieldCheck}
                color={colors.success}
                size={iconSize}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {`Always keep your ${walletTypeLabel.toLowerCase()} safe and don't share it with anyone.`}
              </Text>
            </View>
          </View>

          <View className='flex flex-row items-center justify-start space-x-4'>
            <View
              className='bg-warning/10 flex flex-none items-center justify-center rounded-full'
              style={withSize(borderSize)}
            >
              <FontAwesomeIcon
                icon={faVideo}
                color={colors.warning}
                size={iconSize}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {'Make sure no one can see or record your screen.'}
              </Text>
            </View>
          </View>

          <View className='flex flex-row items-center justify-start space-x-4'>
            <View
              className='bg-failure/10 flex flex-none items-center justify-center rounded-full'
              style={withSize(borderSize)}
            >
              <FontAwesomeIcon
                icon={faExclamationCircle}
                color={colors.failure}
                size={iconSize}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {`Nest Wallet cannot restore your ${walletTypeLabel.toLowerCase()} for you if lost.`}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className='mt-6 flex flex-col space-y-2'>
        <TextButton text='Unlock' onPress={onRevealPress} />
      </View>
    </View>
  );
}
