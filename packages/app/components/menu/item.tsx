import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Text } from '../text';
import { View } from '../view';

export interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon?: IconProp;
  iconReplacement?: React.ReactNode;
  iconSize?: number;
  iconAdornment?: React.ReactNode;
  titleColor?: string;
  iconColor?: string;
  onPress?: VoidFunction;
}

export function MenuItem(props: MenuItemProps) {
  const {
    title,
    subtitle,
    icon,
    iconReplacement,
    iconSize,
    iconAdornment,
    titleColor,
    iconColor,
    onPress,
  } = props;

  return (
    <BaseButton onPress={onPress}>
      <View className='w-full flex-row items-center rounded-xl px-1 py-1'>
        <View className='hover:bg-primary/10 flex w-full flex-row items-center space-x-4 rounded-xl px-3 py-2'>
          {iconReplacement
            ? iconReplacement
            : icon && (
                <View>
                  <FontAwesomeIcon
                    icon={icon}
                    color={iconColor ?? colors.textPrimary}
                    size={iconSize ?? adjust(14, 2)}
                  />
                  {iconAdornment}
                </View>
              )}
          <View className='flex flex-1 flex-col space-y-0.5 pl-1'>
            <Text
              className='text-xs font-medium'
              style={{ color: titleColor ?? colors.textPrimary }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text className='text-text-secondary text-xss font-normal'>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>
    </BaseButton>
  );
}
