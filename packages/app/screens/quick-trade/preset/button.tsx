import { faSliders } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { Audio } from 'expo-av';
import { styled } from 'nativewind';
import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Tuple } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';

interface PresetButtonProps {
  sound?: Audio.Sound;
  disabled?: boolean;
  presets: Tuple<string, 3>;
  onAmountChange: (amount: string) => void;
  onModifyPresets?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}

function arePropsEqual(prev: PresetButtonProps, cur: PresetButtonProps) {
  return (
    prev.disabled === cur.disabled &&
    prev.presets[0] === cur.presets[0] &&
    prev.presets[1] === cur.presets[1] &&
    prev.presets[2] === cur.presets[2] &&
    prev.onAmountChange === cur.onAmountChange
  );
}

export const PresetButtons = memo(
  styled(function (props: PresetButtonProps) {
    const {
      sound,
      disabled = false,
      presets,
      onAmountChange,
      onModifyPresets,
      style,
    } = props;
    return (
      <View style={style}>
        <View className='flex flex-row items-center space-x-2'>
          <BaseButton
            className='flex-1'
            pressSound={sound}
            disabled={disabled}
            onPress={() => onAmountChange(presets[0])}
          >
            <View className='bg-card-highlight items-center justify-center rounded-lg py-1'>
              <Text
                className={cn('text-text-primary text-sm font-medium', {
                  'text-text-primary': !disabled,
                  'text-text-secondary': disabled,
                })}
              >
                {disabled ? '—' : presets[0]}
              </Text>
            </View>
          </BaseButton>
          <BaseButton
            className='flex-1'
            pressSound={sound}
            disabled={disabled}
            onPress={() => onAmountChange(presets[1])}
          >
            <View className='bg-card-highlight items-center justify-center rounded-lg py-1'>
              <Text
                className={cn('text-text-primary text-sm font-medium', {
                  'text-text-primary': !disabled,
                  'text-text-secondary': disabled,
                })}
              >
                {disabled ? '—' : presets[1]}
              </Text>
            </View>
          </BaseButton>
          <BaseButton
            className='flex-1'
            pressSound={sound}
            disabled={disabled}
            onPress={() => onAmountChange(presets[2])}
          >
            <View className='bg-card-highlight items-center justify-center rounded-lg py-1'>
              <Text
                className={cn('text-text-primary text-sm font-medium', {
                  'text-text-primary': !disabled,
                  'text-text-secondary': disabled,
                })}
              >
                {disabled ? '—' : presets[2]}
              </Text>
            </View>
          </BaseButton>
          {onModifyPresets && (
            <BaseButton
              pressSound={sound}
              onPress={onModifyPresets}
              disabled={disabled}
            >
              <View
                className='bg-card-highlight items-center justify-center rounded-lg'
                style={withSize(adjust(28, 2))}
              >
                <FontAwesomeIcon
                  icon={faSliders}
                  color={colors.textSecondary}
                  size={adjust(14, 2)}
                />
              </View>
            </BaseButton>
          )}
        </View>
      </View>
    );
  }),
  arePropsEqual,
);
