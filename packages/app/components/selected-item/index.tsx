import { faAngleDown } from '@fortawesome/pro-regular-svg-icons';
import { adjust } from '../../common/utils/style';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';

export function SelectedItem(props: {
  onPress: VoidFunction;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { children, onPress, disabled } = props;
  return (
    <BaseButton
      className='overflow-hidden rounded-xl'
      onPress={onPress}
      disabled={disabled}
      animationEnabled={false}
      rippleEnabled={!disabled}
    >
      <View className='border-card-highlight bg-card flex h-12 flex-row items-center justify-between space-x-2 rounded-xl border px-4 shadow-sm'>
        <View className='flex flex-row items-center space-x-4'>{children}</View>
        {!disabled && (
          <FontAwesomeIcon
            className='text-text-secondary'
            icon={faAngleDown}
            size={adjust(12, 2)}
          />
        )}
      </View>
    </BaseButton>
  );
}
