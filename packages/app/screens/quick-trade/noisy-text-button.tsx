import { memo, useEffect } from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import {
  TextButton,
  TextButtonProps,
} from '../../components/button/text-button';
import { useParticleAnimation } from '../../components/quests/quest-daily-check-in/utils';
import { colors } from '../../design/constants';
import { useAudioContext } from '../../provider/audio';

export const NoisyTextButton = memo(function (props: TextButtonProps) {
  const { onPress } = props;
  const { hoverSound2, unhoverSound1, confirmSound1 } =
    useAudioContext().sounds;

  const scale = useSharedValue(1);

  const animatedTextButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleHoverIn = () => {
    hoverSound2?.replayAsync();
    scale.value = withTiming(1.05, {
      duration: 250,
      easing: Easing.out(Easing.exp),
    });
  };

  const handleHoverOut = () => {
    unhoverSound1?.replayAsync();
    scale.value = withTiming(1, { easing: Easing.out(Easing.exp) });
  };

  const handlePress = async (e: GestureResponderEvent) => {
    confirmSound1?.replayAsync();
    scale.value = withSpring(0.1, { damping: 15, stiffness: 200 });
    await delay(100);
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    onPress?.(e);
  };

  return (
    <Animated.View style={animatedTextButtonStyle}>
      <TextButton
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        animationEnabled={false}
        disabledColor={colors.cardHighlightSecondary}
        {...props}
        onPress={handlePress}
      />
    </Animated.View>
  );
});

// TODO: optimize this
function Particles(props: {
  backgroundColor?: string;
  onAnimationEnd: VoidFunction;
}) {
  const particleOpacity = useSharedValue(0);
  const { backgroundColor, onAnimationEnd } = props;
  const particleStyle = {
    position: 'absolute',
    backgroundColor,
    top: '50%',
    left: '50%',
  };

  const particles = useParticleAnimation({
    particleAmount: 100,
    particleDelay: 20,
    xMax: 2000,
    xMin: 1000,
    yMax: 2000,
    yMin: 1000,
  });

  const particleContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: particleOpacity.value,
    };
  });

  useEffect(() => {
    particleOpacity.value = withTiming(1, { duration: 100 }, () => {
      particleOpacity.value = withTiming(0, { duration: 500 }, onAnimationEnd);
    });
  }, []);

  const renderParticles = () =>
    particles.map((particle, idx) => {
      const size = Math.random() * 4 + 4;
      const animatedStyle = useAnimatedStyle(() => ({
        opacity: particle.opacity.value,
        transform: [
          { translateX: particle.translateX.value },
          { translateY: particle.translateY.value },
        ],
        width: size,
        height: size,
        borderRadius: size,
      }));

      return (
        <Animated.View
          key={idx}
          style={[particleStyle as StyleProp<ViewStyle>, animatedStyle]}
        />
      );
    });

  return (
    <Animated.View style={particleContainerStyle}>
      {renderParticles()}
    </Animated.View>
  );
}
