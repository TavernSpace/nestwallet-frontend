import cn from 'classnames';
import { styled } from 'nativewind';
import { forwardRef, useMemo, useState } from 'react';
import {
  Platform,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../design/constants';
import { getFontStyle } from '../../design/utils';
import { IErrorTooltipProps, InlineErrorTooltip } from '../input-error';
import { View } from '../view';

export interface ITextInputProps {
  errorText?: string;
  inputProps?: RNTextInputProps;
  errorProps?: IErrorTooltipProps;
  style?: StyleProp<ViewStyle>;
  filled?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const RawTextInput = styled(
  forwardRef<RNTextInput, RNTextInputProps & { lineHeightAdjustment?: number }>(
    function (props, ref) {
      const { style, lineHeightAdjustment = 0, ...rest } = props;
      const fontStyle = useMemo(
        () => getFontStyle(style, lineHeightAdjustment),
        [style, lineHeightAdjustment],
      );
      return (
        <RNTextInput
          ref={ref}
          autoComplete='off'
          {...rest}
          allowFontScaling={false}
          style={[
            {
              paddingBottom: Platform.OS === 'ios' ? 2 : undefined,
            },
            style,
            fontStyle,
          ]}
        />
      );
    },
  ),
);

export const TextInput = styled(
  forwardRef<RNTextInput, ITextInputProps>(function (props, ref) {
    const {
      errorText,
      inputProps,
      errorProps,
      style,
      filled = false,
      startAdornment,
      endAdornment,
    } = props;

    const [focused, setFocused] = useState(false);

    const isMultiline = !!inputProps?.multiline;
    const editable = inputProps?.editable !== false;
    const webStyles =
      Platform.OS === 'web' && filled
        ? {
            WebkitBoxShadow: `0 0 0px 1000px ${colors.cardHighlight} inset`,
            boxShadow: `0 0 0px 1000px ${colors.cardHighlight} inset`,
          }
        : {};

    return (
      <View className='w-full' style={style}>
        {!isMultiline ? (
          <View
            className={cn('flex h-12 flex-row items-center rounded-2xl px-1', {
              'border-primary': focused && editable,
              'border-card-highlight bg-card border': !filled,
              'bg-card-highlight': filled,
            })}
          >
            {startAdornment}
            <RawTextInput
              ref={ref}
              className='text-text-primary block w-full flex-1 px-3 text-sm font-normal outline-none'
              style={{
                minHeight: 32,
                ...webStyles,
              }}
              {...inputProps}
              placeholderTextColor={colors.textPlaceholder}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {endAdornment}
          </View>
        ) : (
          <RawTextInput
            className={cn(
              'text-text-primary block w-full rounded-2xl px-4 py-3 text-sm font-normal outline-none',
              {
                'border-primary': focused && editable,
                'border-card-highlight bg-card border': !filled,
                'bg-card-highlight': filled,
              },
            )}
            style={{ minHeight: 48 }}
            {...inputProps}
            placeholderTextColor={colors.textPlaceholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        )}
        {!!errorText && (
          <View
            className='flex w-full flex-row items-center'
            style={{ marginTop: errorText ? 8 : 0 }}
          >
            <InlineErrorTooltip
              {...errorProps}
              isEnabled={!!errorText}
              errorText={errorText}
            />
          </View>
        )}
      </View>
    );
  }),
);
