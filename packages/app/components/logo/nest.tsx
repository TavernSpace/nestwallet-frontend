import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import NestLogoLight from '../../assets/images/logos/nest-logo-light.svg';
import NestLogo from '../../assets/images/logos/nest-logo.svg';
import { withSize } from '../../common/utils/style';
import { Svg } from '../svg';
import { View } from '../view';

export const NestLight = styled(function (props: {
  size: number;
  rounded: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { size, rounded, style } = props;

  return (
    <View
      className='overflow-hidden'
      style={[
        style,
        withSize(size),
        { borderRadius: rounded ? 9999 : size / 4 },
      ]}
    >
      <Svg source={NestLogoLight} height={size} width={size} />
    </View>
  );
});

export const NestDark = styled(function (props: {
  size: number;
  rounded: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { size, rounded, style } = props;

  return (
    <View
      className='overflow-hidden'
      style={[
        style,
        withSize(size),
        { borderRadius: rounded ? 9999 : size / 4 },
      ]}
    >
      <Svg source={NestLogo} height={size} width={size} />
    </View>
  );
});
