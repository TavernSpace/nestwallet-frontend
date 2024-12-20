import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import cn from 'classnames';
import { Audio } from 'expo-av';
import React from 'react';
import { Platform } from 'react-native';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { IconButton } from '../button/icon-button';
import { Text } from '../text';
import { View } from '../view';

export function ActionSheetHeader(props: {
  adornment?: React.ReactNode;
  title?: string;
  type: 'normal' | 'detached' | 'fullscreen';
  position?: 'default' | 'center';
  onClose?: VoidFunction;
  closeSound?: Audio.Sound;
}) {
  const {
    adornment,
    title,
    onClose,
    closeSound,
    type,
    position = 'default',
  } = props;

  return (
    <View
      className={cn('flex flex-row items-center justify-between px-4 pb-3', {
        'mt-0.5': Platform.OS === 'web' || type === 'detached',
      })}
    >
      {position === 'center' && onClose && (
        <View style={withSize(adjust(20, 2))} />
      )}
      {!title ? (
        adornment ?? <View />
      ) : (
        <View className='flex flex-row items-center space-x-2'>
          {adornment}
          <Text className='text-text-primary text-base font-medium'>
            {title}
          </Text>
        </View>
      )}
      {onClose ? (
        <IconButton
          className='-mr-2'
          icon={faTimes}
          pressSound={closeSound}
          size={adjust(20, 2)}
          color={colors.textSecondary}
          onPress={onClose}
        />
      ) : null}
    </View>
  );
}
