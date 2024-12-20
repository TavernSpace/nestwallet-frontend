import { useState } from 'react';
import { LayoutChangeEvent, Platform } from 'react-native';
import { Portal } from 'react-native-paper';
import { View } from '../view';
import { ActionSheetContent, ActionSheetContentProps } from './content';

interface ActionSheetProps
  extends Omit<ActionSheetContentProps, 'portalHeight'> {}

export function ActionSheet(props: ActionSheetProps) {
  const { isShowing, blur } = props;

  const [portalHeight, setPortalHeight] = useState<number>();
  const [hasShown, setHasShown] = useState(isShowing);

  // TODO: currently there is a bug where if we render an action sheet in a modal
  // screen in ios the height is wrong for a split second, which causes any sheets on the screen
  // be missing vertical padding. Need to think of a solution, for now, just make sure
  // that no modal computes the height instantly on ios
  const handlePortalLayout = async (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height !== portalHeight) {
      setPortalHeight(height);
    }
  };

  if (!isShowing && !hasShown && Platform.OS === 'ios') {
    return null;
  }

  // once we become visible, measure portal height first
  if (!portalHeight) {
    return (
      <Portal>
        <View
          className='absolute h-full w-full'
          style={
            {
              backdropFilter: blur && isShowing ? `blur(${blur}px)` : undefined,
            } as any
          }
          onLayout={handlePortalLayout}
        />
      </Portal>
    );
  }

  if (!hasShown) {
    setHasShown(true);
  }

  return (
    <Portal>
      <View
        className='pointer-events-none absolute h-full w-full'
        pointerEvents='none'
        onLayout={handlePortalLayout}
      />
      <ActionSheetContent {...props} portalHeight={portalHeight} />
    </Portal>
  );
}
