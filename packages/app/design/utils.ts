import { Platform, StyleProp, StyleSheet, TextStyle } from 'react-native';

export function adjustTextStyle(
  style: TextStyle,
  lineHeightAdjustment = 4,
): TextStyle {
  return { ...style, ...getFontStyle(style, lineHeightAdjustment) };
}

export function getFontStyle(
  style: StyleProp<TextStyle>,
  lineHeightAdjustment = 4,
) {
  if (Platform.OS === 'web') {
    return styles.web;
  }
  const flattenStyle = StyleSheet.flatten(style);
  if (!flattenStyle) {
    return styles.regular;
  }

  const isItalic = flattenStyle.fontStyle === 'italic';
  const fontWeight = flattenStyle.fontWeight ?? '400';
  const fontSize = (flattenStyle.fontSize ?? 14) + 2;
  const fontStyle = {
    ...((fontWeightMap as any)[fontWeight] || styles.regular),
    fontSize,
  };
  const letterSpacingStyle = {
    letterSpacing: 0.2,
  };
  const textStyle =
    flattenStyle.fontSize && flattenStyle.fontSize in lineHeightMap
      ? {
          ...fontStyle,
          lineHeight:
            lineHeightMap[flattenStyle.fontSize as keyof typeof lineHeightMap] +
            lineHeightAdjustment,
        }
      : { ...fontStyle };
  return {
    ...textStyle,
    ...letterSpacingStyle,
    fontWeight: undefined,
    fontFamily: isItalic
      ? textStyle.fontFamily + 'Italic'
      : textStyle.fontFamily,
  };
}

const styles = StyleSheet.create({
  web: {
    fontFamily: 'Aeonik',
  },
  light: {
    fontFamily: 'Aeonik_300Light',
  },
  regular: {
    fontFamily: 'Aeonik_400Regular',
  },
  medium: {
    fontFamily: 'Aeonik_500Medium',
  },
  bold: {
    fontFamily: 'Aeonik_700Bold',
  },
});

const fontWeightMap = {
  normal: styles.regular,
  medium: styles.medium,
  bold: styles.bold,
  '300': styles.light,
  '400': styles.regular,
  '500': styles.medium,
  '700': styles.bold,
};

const lineHeightMap = {
  12: 16,
  14: 20,
  16: 24,
  18: 28,
  20: 28,
  24: 32,
  30: 36,
  36: 36,
  48: 48,
  60: 60,
  72: 72,
  96: 96,
  144: 144,
};
