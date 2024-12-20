import { styled } from 'nativewind';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { colors } from '../../design/constants';
import { View } from '../view';

export interface BadgeProps extends ViewProps {
  children?: React.ReactNode;
  size?: number;
  borderSize?: number;
  style?: StyleProp<ViewStyle>;
  hidden?: boolean;
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Badge = styled(function (props: BadgeProps) {
  const {
    children,
    size = 8,
    borderSize = 4,
    style,
    containerStyle,
    hidden,
    color,
  } = props;

  return (
    <View style={style}>
      {!hidden && (
        // We use an absolute view instead of a border since border can cause weird outlines on mobile sometimes
        <View
          className='bg-background absolute bottom-0.5 right-0.5 z-50 items-center justify-center rounded-full'
          style={[
            containerStyle,
            {
              height: size + borderSize,
              width: size + borderSize,
            },
          ]}
        >
          <View
            className='rounded-full'
            style={{
              backgroundColor: color || colors.primary,
              height: size,
              width: size,
            }}
          />
        </View>
      )}
      {children}
    </View>
  );
});

export const BadgeDot = styled(function (props: Omit<BadgeProps, 'children'>) {
  const {
    size = 8,
    borderSize = 4,
    style,
    containerStyle,
    hidden,
    color,
  } = props;

  return (
    <View style={style}>
      {!hidden && (
        <View
          className='bg-background items-center justify-center rounded-full'
          style={[
            containerStyle,
            {
              height: size + borderSize,
              width: size + borderSize,
            },
          ]}
        >
          <View
            className='rounded-full'
            style={{
              backgroundColor: color || colors.primary,
              height: size,
              width: size,
            }}
          />
        </View>
      )}
    </View>
  );
});
