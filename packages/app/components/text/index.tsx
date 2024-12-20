import { styled } from 'nativewind';
import { useMemo } from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { getFontStyle } from '../../design/utils';

export const Text = styled((props: TextProps) => {
  const { style, ...textProps } = props;
  const fontStyle = useMemo(() => getFontStyle(style), [style]);
  return (
    <RNText
      allowFontScaling={false}
      {...textProps}
      style={[style, fontStyle]}
    />
  );
});
