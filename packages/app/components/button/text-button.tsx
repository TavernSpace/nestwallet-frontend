import cn from 'classnames';
import { StyledProps } from 'nativewind';
import { TextStyle } from 'react-native';
import { colors } from '../../design/constants';
import { Text } from '../text';
import { View } from '../view';
import { Button, ButtonProps } from './button';

export type TextButtonProps = Omit<
  ButtonProps & {
    text: string;
    textStyle?: StyledProps<TextStyle>;
    adornment?: React.ReactNode;
  },
  'children'
>;

export function TextButton(props: TextButtonProps) {
  const { text, type, textStyle, adornment, ...buttonProps } = props;
  return (
    <Button type={type} {...buttonProps}>
      <View className='flex flex-row items-center space-x-2'>
        {adornment}
        <Text
          className={cn('text-sm', {
            'font-medium': type !== 'primary' && type !== undefined,
            'font-bold': type === 'primary' || type === undefined,
          })}
          style={[
            {
              color: props.disabled
                ? colors.textSecondary
                : type === 'tertiary' || type === 'transparent'
                ? buttonProps.buttonColor ?? colors.primary
                : colors.textButtonPrimary,
            },
            textStyle,
          ]}
        >
          {text}
        </Text>
      </View>
    </Button>
  );
}
