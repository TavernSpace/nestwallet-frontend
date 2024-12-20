import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Polygon, Text } from 'react-native-svg';
import { colors } from '../../../design/constants';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { View } from '../../view';

export type HexagonProps = {
  size: number;
  fillColor: string;
  borderColor: string;
  textColor: string;
  text?: number;
  style?: StyleProp<ViewStyle>;
  faIcon?: IconProp;
};

export const Hexagon = styled(function (props: HexagonProps) {
  const { size, text, borderColor, fillColor, textColor, faIcon, style } =
    props;

  return (
    <View className='justify-center' style={style}>
      <Svg
        height={size}
        width={size}
        viewBox='0 0 200 200'
        className='flex items-center justify-center'
      >
        <Polygon
          points='100,15 173,55 173,145 100,185 27,145 27,55'
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={15}
        />
        {text ? (
          <Text
            x='100'
            y='130'
            textAnchor='middle'
            fontFamily='Aeonik'
            fontWeight='700'
            fontSize={80}
            fill={textColor}
          >
            {text}
          </Text>
        ) : null}
      </Svg>
      {faIcon && (
        <View className='absolute flex h-full w-full items-center justify-center'>
          <FontAwesomeIcon
            icon={faIcon}
            size={size / 3}
            color={colors.textPrimary}
          />
        </View>
      )}
    </View>
  );
});
