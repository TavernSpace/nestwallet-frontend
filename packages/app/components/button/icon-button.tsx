import { IconProp } from '@fortawesome/fontawesome-svg-core';
import cn from 'classnames';
import { Audio } from 'expo-av';
import { styled } from 'nativewind';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { ActivityIndicator } from '../activity-indicator';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';
import { BaseButton, BaseButtonProps } from './base-button';

export type IconButtonProps = Omit<BaseButtonProps, 'children'> & {
  icon: IconProp;
  color?: string;
  pressSound?: Audio.Sound;
  size: number;
  adornment?: React.ReactNode;
  disableHover?: boolean;
};

export const IconButton = styled(function (props: IconButtonProps) {
  const {
    style,
    icon,
    color,
    size,
    adornment,
    disableHover,
    ...baseButtonProps
  } = props;

  return (
    <BaseButton
      className='rounded-full'
      {...baseButtonProps}
      style={style}
      pressableStyle={{ borderRadius: 9999 }}
      scale={0.9}
    >
      <View
        className={cn('rounded-full', {
          'hover:bg-card-highlight hover:bg-opacity-50': !disableHover,
        })}
      >
        <View
          className='items-center justify-center'
          style={{
            width: size * 1.5,
            height: size * 1.5,
          }}
        >
          <FontAwesomeIcon icon={icon} color={color} size={size} />
        </View>
        {adornment}
      </View>
    </BaseButton>
  );
});

export const FilledIconButton = styled(function (
  props: IconButtonProps & {
    backgroundColor?: string;
    rounded?: boolean;
    ratio?: number;
  },
) {
  const {
    style,
    icon,
    color,
    size,
    backgroundColor,
    rounded = true,
    adornment,
    ratio,
    ...baseButtonProps
  } = props;
  return (
    <BaseButton
      className={cn('', {
        'rounded-full': rounded,
        'rounded-xl': !rounded,
      })}
      {...baseButtonProps}
      style={style}
      pressableStyle={{ borderRadius: rounded ? 9999 : 12 }}
      scale={0.9}
    >
      <View
        className={cn('items-center justify-center', {
          'rounded-full': rounded,
          'rounded-xl': !rounded,
        })}
        style={{
          backgroundColor: backgroundColor || opacity(colors.primary, 10),
          width: size,
          height: size,
        }}
      >
        <View
          className='items-center justify-center'
          style={{
            width: size,
            height: size,
          }}
        >
          <FontAwesomeIcon
            icon={icon}
            color={color || colors.primary}
            size={Math.floor(size * (ratio || 2 / 3))}
          />
        </View>
        {adornment}
      </View>
    </BaseButton>
  );
});

export const ColoredIconButton = styled(function (
  props: Omit<BaseButtonProps, 'children'> & {
    icon: IconProp;
    color: string;
    size?: 'sm' | 'md';
  },
) {
  const { icon, color, size = 'md' } = props;

  return (
    <BaseButton {...props}>
      <View
        className='items-center justify-center rounded-md'
        style={{
          ...withSize(adjust(size === 'md' ? 28 : 24)),
          backgroundColor: opacity(color, 10),
        }}
      >
        <FontAwesomeIcon
          icon={icon}
          size={adjust(size === 'md' ? 18 : 14, 2)}
          color={color}
        />
      </View>
    </BaseButton>
  );
});

export const NeutralIconButton = styled(function (
  props: Omit<BaseButtonProps, 'children'> & {
    icon: IconProp;
    loading?: boolean;
    size?: number;
    iconSize?: number;
  },
) {
  const {
    icon,
    loading = false,
    size: defaultSize,
    iconSize: defaultIconSize,
  } = props;

  const size = defaultSize ?? adjust(28);
  const iconSize = defaultIconSize ?? adjust(18, 2);

  return (
    <BaseButton {...props} disabled={loading}>
      <View
        className='bg-card items-center justify-center'
        style={[withSize(size), { borderRadius: size >= 36 ? 8 : 6 }]}
      >
        {loading ? (
          <ActivityIndicator size={iconSize} color={colors.textSecondary} />
        ) : (
          <FontAwesomeIcon
            icon={icon}
            size={iconSize}
            color={colors.textSecondary}
          />
        )}
      </View>
    </BaseButton>
  );
});

export const ToggleIconButton = styled(function (
  props: Omit<BaseButtonProps, 'children'> & {
    icon: IconProp;
    selected: boolean;
    size?: number;
    iconSize?: number;
  },
) {
  const {
    icon,
    selected,
    size: defaultSize,
    iconSize: defaultIconSize,
  } = props;

  const size = defaultSize ?? adjust(28);
  const iconSize = defaultIconSize ?? adjust(18, 2);

  return (
    <BaseButton {...props}>
      <View
        className={cn('items-center justify-center', {
          'bg-card': !selected,
          'bg-primary/10': selected,
        })}
        style={[withSize(size), { borderRadius: size >= 36 ? 8 : 6 }]}
      >
        <FontAwesomeIcon
          icon={icon}
          size={iconSize}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>
    </BaseButton>
  );
});
