import { IconProp } from '@fortawesome/fontawesome-svg-core';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity } from '../../../common/utils/functions';
import { adjust } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Text } from '../../text';
import { View } from '../../view';

export const QuestChip = styled(function (props: {
  color: string;
  text: string;
  size?: 'small' | 'medium';
  icon?: IconProp;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { color, text, icon, size = 'small', iconSize, style } = props;
  return (
    <View
      className={cn(
        'flex w-fit flex-row items-center justify-center rounded-full',
        {
          'space-x-1 px-2 py-[1px]': size === 'small',
          'space-x-2 px-3 py-[3px]': size !== 'small',
        },
      )}
      style={[{ backgroundColor: opacity(color, 10) }, style]}
    >
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          color={color}
          size={iconSize || adjust(size === 'small' ? 8 : 10, 2)}
        />
      )}
      <Text
        className={cn('font-medium', {
          'text-xs': size === 'small',
          'text-sm': size !== 'small',
        })}
        style={{ color }}
      >
        {text}
      </Text>
    </View>
  );
});
