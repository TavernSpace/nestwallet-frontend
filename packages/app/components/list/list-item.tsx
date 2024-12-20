import { faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { BaseButton, BaseButtonProps } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Text } from '../text';
import { View } from '../view';

export const ListItem = styled(function (props: BaseButtonProps) {
  const { style, ...rest } = props;

  return (
    <View className='overflow-hidden' style={style}>
      <BaseButton
        className={cn('overflow-hidden', {
          'hover:bg-card-highlight': !props.disabled,
        })}
        rippleEnabled={true}
        animationEnabled={false}
        {...rest}
      />
    </View>
  );
});

export function ListItemWithRightAngle(props: BaseButtonProps) {
  const { children, ...buttonProps } = props;
  return (
    <ListItem {...buttonProps}>
      <View className='flex flex-row items-center justify-between px-4 py-4'>
        {children}
        <FontAwesomeIcon
          color={colors.textSecondary}
          icon={faAngleRight}
          size={adjust(16, 2)}
        />
      </View>
    </ListItem>
  );
}

export function ListItemButton(props: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  onPress: VoidFunction;
}) {
  const { icon, title, description, disabled, onPress } = props;
  return (
    <ListItem className='w-full' onPress={onPress} disabled={disabled}>
      <View className='flex w-full flex-row items-center space-x-4 px-4 py-4'>
        {icon}
        <View className='flex flex-1 flex-col'>
          <Text className='text-text-primary text-sm font-medium'>{title}</Text>
          {description && (
            <Text className='text-text-secondary text-xs font-normal'>
              {description}
            </Text>
          )}
        </View>
      </View>
    </ListItem>
  );
}
