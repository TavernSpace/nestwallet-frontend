import { faCircleDashed } from '@fortawesome/pro-light-svg-icons';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';

export function AddWalletButton(props: { onPress: VoidFunction }) {
  const { onPress } = props;

  return (
    <BaseButton onPress={onPress} scale={0.99}>
      <View className='bg-background flex w-full flex-row items-center space-x-4 rounded-xl px-4 py-3'>
        <View>
          <FontAwesomeIcon
            icon={faCircleDashed}
            color={colors.textSecondary}
            size={adjust(36)}
          />
          <View className='absolute' style={{ top: 10, left: 10 }}>
            <FontAwesomeIcon
              icon={faPlus}
              color={colors.textSecondary}
              size={adjust(16)}
            />
          </View>
        </View>
        <Text className='text-text-secondary text-sm font-medium'>
          Add a Wallet
        </Text>
      </View>
    </BaseButton>
  );
}
