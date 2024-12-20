import { useCallback, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export function useDynamicFontSizing(
  maxCharWidthAtMaxFontSize: number,
  maxFontSize: number,
  minFontSize: number,
): {
  onLayout: (event: LayoutChangeEvent) => void;
  fontSize: number;
  onSetFontSize: (amount: string) => void;
} {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [textInputElementWidth, setTextInputElementWidth] = useState<number>(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (textInputElementWidth) return;

      const width = event.nativeEvent.layout.width;
      setTextInputElementWidth(width);
    },
    [setTextInputElementWidth, textInputElementWidth],
  );

  const onSetFontSize = useCallback(
    (amount: string) => {
      const stringWidth = getStringWidth(
        amount,
        maxCharWidthAtMaxFontSize,
        fontSize,
        maxFontSize,
      );
      const scaledSize = fontSize * (textInputElementWidth / stringWidth);
      const scaledSizeWithMin = Math.max(scaledSize, minFontSize);
      const newFontSize = Math.round(Math.min(maxFontSize, scaledSizeWithMin));
      setFontSize(newFontSize);
    },
    [
      fontSize,
      maxFontSize,
      minFontSize,
      maxCharWidthAtMaxFontSize,
      textInputElementWidth,
    ],
  );

  return { onLayout, fontSize, onSetFontSize };
}

const getStringWidth = (
  value: string,
  maxCharWidthAtMaxFontSize: number,
  currentFontSize: number,
  maxFontSize: number,
): number => {
  const widthAtMaxFontSize = value.length * maxCharWidthAtMaxFontSize;
  return widthAtMaxFontSize * (currentFontSize / maxFontSize);
};
