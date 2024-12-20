import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Defs, Ellipse, LinearGradient, Stop, Svg } from 'react-native-svg';
import { colors } from '../../../../design/constants';

export interface SemiCircleProgressBarProps {
  width: number;
  height: number;
  strokeWidth: number;
  progress: number;
  unfilledColor?: string;
  startColor?: string;
  endColor?: string;
}
export function SemiCircleProgressBar(props: SemiCircleProgressBarProps) {
  const {
    width,
    height,
    strokeWidth,
    progress,
    unfilledColor,
    startColor,
    endColor,
  } = props;

  const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

  const radius = (width - strokeWidth) / 2;
  const innerRadius = radius - strokeWidth / 2;

  const circumfrence = 2 * Math.PI * innerRadius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset:
        2 * Math.PI * -(innerRadius * (-0.5 * animatedProgress.value + 1)),
    };
  });

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transform: 'scaleX(-1)',
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'>
            <Stop offset='0%' stopColor={startColor ?? colors.primary} />
            <Stop offset='100%' stopColor={endColor ?? colors.primary} />
          </LinearGradient>
        </Defs>
        <Ellipse
          cx={radius}
          cy={radius}
          rx={innerRadius}
          ry={innerRadius}
          fill={'transparent'}
          stroke={unfilledColor ?? colors.textSecondary}
          strokeDasharray={`${circumfrence} ${circumfrence}`}
          strokeWidth={strokeWidth}
          strokeDashoffset={2 * Math.PI * -(innerRadius * 0.5)}
          strokeLinecap='round'
        />
        <AnimatedEllipse
          animatedProps={animatedProps}
          cx={radius}
          cy={radius}
          rx={innerRadius}
          ry={innerRadius}
          fill={'transparent'}
          stroke={'url(#grad)'}
          strokeDasharray={`${circumfrence} ${circumfrence}`}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
        />
      </Svg>
    </View>
  );
}
