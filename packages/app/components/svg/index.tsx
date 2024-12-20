import { ImageStyle } from 'expo-image';
import { styled } from 'nativewind';
import { ImageSourcePropType, StyleProp } from 'react-native';
import { Image } from '../image';

export const Svg = styled(function (props: {
  source:
    | ImageSourcePropType
    | React.ComponentType<{ height: number; width: number }>;
  height: number;
  width: number;
  style?: StyleProp<ImageStyle>;
}) {
  const { source, height, width, style } = props;

  return (
    <Image
      source={source as ImageSourcePropType}
      style={[
        style,
        {
          height: height,
          width: width,
        },
      ]}
    />
  );
});
