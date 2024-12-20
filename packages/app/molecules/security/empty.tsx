import { faShieldCheck } from '@fortawesome/pro-solid-svg-icons';
import { adjust } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';

export function EmptySecurityState() {
  return (
    <View
      className='bg-card w-full items-center justify-center rounded-2xl'
      style={{ height: 198 + adjust(40, 40) }}
    >
      <View className='bg-success/10 h-12 w-12 items-center justify-center rounded-full'>
        <FontAwesomeIcon
          icon={faShieldCheck}
          size={24}
          color={colors.success}
        />
      </View>
      <View className='mt-3 flex flex-col items-center justify-center'>
        <Text className='text-text-primary text-sm font-medium'>
          {'No issues found'}
        </Text>
        <Text className='text-text-secondary text-xs font-normal'>
          {'This is a trusted token.'}
        </Text>
      </View>
    </View>
  );
}
