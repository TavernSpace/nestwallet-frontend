import { styled } from 'nativewind';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../text';
import { View } from '../view';

export const Field = styled(function (props: {
  label: string;
  labelStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { label, labelStyle, children, startAdornment, endAdornment, style } =
    props;
  return (
    <View style={style}>
      <View
        className='my-2 flex flex-row items-center justify-between px-4'
        style={labelStyle}
      >
        <View className='flex flex-row items-center space-x-2'>
          {startAdornment && <View>{startAdornment}</View>}
          <Text className='text-text-primary text-xs font-medium'>{label}</Text>
        </View>
        {endAdornment && <View className='-mr-2'>{endAdornment}</View>}
      </View>
      {children}
    </View>
  );
});
