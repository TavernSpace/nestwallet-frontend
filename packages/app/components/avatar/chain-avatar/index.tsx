import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { IntRange } from '../../../common/types';
import { opacity } from '../../../common/utils/functions';
import { colors } from '../../../design/constants';
import { ChainInfo } from '../../../features/chain';
import { Svg } from '../../svg';
import { View } from '../../view';

interface ChainAvatarProps {
  chainInfo: ChainInfo;
  size: number;
  border?: boolean;
  borderColor?: string;
  shape?: 'circle' | 'square';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ChainAvatar = styled(function (props: ChainAvatarProps) {
  const {
    chainInfo,
    border,
    borderColor,
    size,
    shape = 'circle',
    disabled = false,
    style,
  } = props;

  const opacityValue: IntRange<0, 101> = 20;

  return (
    <View
      className='items-center justify-center'
      style={[
        style,
        {
          backgroundColor: border
            ? borderColor ?? colors.background
            : undefined,
          width: border ? size + 4 : size,
          height: border ? size + 4 : size,
          borderRadius: shape === 'circle' ? 9999 : 6,
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? 9999 : 6,
          backgroundColor: opacity(chainInfo.color, opacityValue),
        }}
      >
        <Svg source={{ uri: chainInfo.icon }} width={size} height={size} />
      </View>
      {disabled && (
        <View
          className='absolute right-0 top-0'
          style={{
            width: size,
            height: size,
            borderRadius: shape === 'circle' ? 9999 : 6,
            backgroundColor: opacity('#000000', 50),
          }}
        />
      )}
    </View>
  );
});
