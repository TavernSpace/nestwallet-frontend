import { styled } from 'nativewind';
import React, { useRef } from 'react';
import { View as RNView, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator } from '../activity-indicator';
import { View } from '../view';

export const Card = styled(function (props: {
  isLoading?: boolean;
  children?: React.ReactNode;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isLoading, children, maxHeight, style } = props;
  // do not apply className when loading. we want loading state to be
  // consistent across all cards
  const cardMaxHeight = maxHeight;
  const divRef = useRef<RNView>(null);

  if (isLoading) {
    return (
      <View className='bg-background relative'>
        <View className='flex items-center justify-center py-8'>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <View
      className='bg-background relative'
      style={[style, { maxHeight: cardMaxHeight }]}
      ref={divRef}
    >
      {children}
    </View>
  );
});
