import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export function useOverlayDimension() {
  const [overlayDimensions, setOverlayDimensions] = useState({
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  });

  const heightLimit = SCREEN_HEIGHT + 16;
  const widthLimit = SCREEN_WIDTH + 16;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const newHeight = Math.max(Math.min(heightLimit, height), SCREEN_HEIGHT);
    const newWidth = Math.max(Math.min(widthLimit, width), SCREEN_WIDTH);
    if (
      newHeight !== overlayDimensions.height ||
      newWidth !== overlayDimensions.width
    ) {
      setOverlayDimensions({
        height: newHeight,
        width: newWidth,
      });
    }
  };
  return {
    heightLimit,
    widthLimit,
    overlayDimensions,
    handleLayout,
  };
}
