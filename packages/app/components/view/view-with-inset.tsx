import { useHeaderHeight } from '@react-navigation/elements';
import { styled } from 'nativewind';
import React from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { View } from '.';
import { usePlatformHeaderHeight } from '../../features/header';
import { useSafeAreaInsets } from '../../features/safe-area';

export const ViewWithInset = styled(function (props: {
  children: React.ReactNode;
  hasTopInset?: boolean;
  hasBottomInset?: boolean;
  shouldAvoidKeyboard?: boolean;
  keyboardOffset?: number;
  isScrollable?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    children,
    hasTopInset,
    hasBottomInset,
    keyboardOffset = 0,
    onLayout,
    style,
  } = props;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { headerHeight: platformHeaderHeight } = usePlatformHeaderHeight();

  const normalizedHeaderHeight = headerHeight === 0 ? 0 : platformHeaderHeight;
  const shouldAvoidKeyboard =
    Platform.OS !== 'web' && props.shouldAvoidKeyboard;

  if (shouldAvoidKeyboard) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        keyboardVerticalOffset={
          normalizedHeaderHeight + insets.top + keyboardOffset
        }
      >
        <View
          style={[
            style,
            {
              paddingTop: hasTopInset ? insets.top : undefined,
              paddingBottom: hasBottomInset ? insets.bottom : undefined,
            },
          ]}
          onLayout={onLayout}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={[
        style,
        {
          paddingTop: hasTopInset ? insets.top : undefined,
          paddingBottom: hasBottomInset ? insets.bottom : undefined,
        },
      ]}
      onLayout={onLayout}
    >
      {children}
    </View>
  );
});
