import cn from 'classnames';
import color from 'color';
import { styled } from 'nativewind';
import { Platform } from 'react-native';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { ActivityIndicator } from '../activity-indicator';
import { View } from '../view';
import { BaseButton, BaseButtonProps } from './base-button';

export type ButtonProps = BaseButtonProps & {
  type?: 'primary' | 'secondary' | 'tertiary' | 'transparent';
  loading?: boolean;
  disabled?: boolean;
  disabledColor?: string;
  buttonColor?: string;
};

export const BUTTON_HEIGHT = Platform.OS === 'web' ? 42 : 50;

export const Button = styled(function (props: ButtonProps) {
  const { style, type, children, buttonColor, disabledColor, ...buttonProps } =
    props;

  const rippleColor = color('white').alpha(0.12).rgb().string();

  return (
    <View style={style}>
      <BaseButton
        className='rounded-full'
        {...buttonProps}
        borderless
        pressableStyle={{ borderRadius: 9999 }}
        rippleColor={rippleColor}
        disabled={props.loading || props.disabled}
        onPress={props.loading || props.disabled ? undefined : props.onPress}
      >
        <View
          className={cn(
            'flex flex-row items-center justify-center space-x-2 rounded-full',
            {
              'border-[1px]':
                (type === 'secondary' || type === 'tertiary') &&
                !props.disabled,
            },
          )}
          style={{
            height: BUTTON_HEIGHT,
            borderColor:
              (type !== 'secondary' && type !== 'tertiary') || props.disabled
                ? undefined
                : buttonColor ?? colors.primary,
            backgroundColor:
              type === 'transparent'
                ? 'transparent'
                : props.disabled
                ? disabledColor || colors.card
                : type === 'tertiary'
                ? 'transparent'
                : buttonColor
                ? buttonColor
                : type === 'secondary'
                ? colors.background
                : colors.primary,
          }}
        >
          <View className='flex flex-row items-center justify-center'>
            {children}
          </View>
          {props.loading && (
            <ActivityIndicator
              size={adjust(16)}
              color={
                props.disabled
                  ? colors.textSecondary
                  : type === 'transparent' || type === 'tertiary'
                  ? colors.primary
                  : colors.textButtonPrimary
              }
            />
          )}
        </View>
      </BaseButton>
    </View>
  );
});
