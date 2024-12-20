import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../design/constants';

export interface ExpandingDotProps {
  data: Array<Object>;
  scrollX: Animated.AnimatedInterpolation<number>;
  containerStyle?: ViewStyle;
  dotStyle: ViewStyle;
  inActiveDotOpacity?: number;
  inActiveDotColor?: string;
  expandingDotWidth?: number;
  activeDotColor?: string;
}

export const ExpandingDot = ({
  scrollX,
  data,
  dotStyle,
  containerStyle,
  inActiveDotColor,
  expandingDotWidth,
  activeDotColor,
}: ExpandingDotProps) => {
  const defaultProps = {
    inActiveDotColor: inActiveDotColor || colors.textPrimary,
    expandingDotWidth: expandingDotWidth || 20,
    dotWidth: (dotStyle.width as number) || 10,
    activeDotColor: activeDotColor || colors.primary,
  };

  return (
    <View
      pointerEvents={'none'}
      style={[styles.containerStyle, containerStyle]}
    >
      {data.map((_, index) => {
        const pageNumber = index + 1;
        const inputRange = [pageNumber - 1, pageNumber, pageNumber + 1];

        const color = scrollX.interpolate({
          inputRange,
          outputRange: [
            defaultProps.inActiveDotColor,
            defaultProps.activeDotColor,
            defaultProps.inActiveDotColor,
          ],
          extrapolate: 'clamp',
        });
        const expand = scrollX.interpolate({
          inputRange,
          outputRange: [
            defaultProps.dotWidth,
            defaultProps.expandingDotWidth,
            defaultProps.dotWidth,
          ],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`dot-${index}`}
            style={[
              styles.dotStyle,
              dotStyle,
              { width: expand },
              { opacity: 1 },
              { backgroundColor: color },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dotStyle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
