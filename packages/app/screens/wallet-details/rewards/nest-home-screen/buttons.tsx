import { faChevronsRight } from '@fortawesome/pro-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../../../common/api/utils';
import { opacity } from '../../../../common/utils/functions';
import { adjust } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';

export const DoubleChevronButton = styled(function (props: {
  backgroundColor: string;
  isGlowing?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: VoidFunction;
}) {
  const { backgroundColor, isGlowing, style, onPress } = props;

  const width = 44;
  const height = 24;
  const hiddenLeft = -width - 3; //Extra pixels for saftey
  const glowLeft = useSharedValue(hiddenLeft);

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      opacity: 0.4,
      width,
      height,
      left: glowLeft.value,
    };
  });

  const handleAnimateGlow = async () => {
    glowLeft.value = withTiming(width, {
      duration: 800,
    });
    await delay(800);
    glowLeft.value = hiddenLeft;
    await delay(800);
  };

  useEffect(() => {
    let isMounted = true;

    const startAnimationLoop = async () => {
      while (isMounted) {
        await handleAnimateGlow();
      }
    };

    if (isGlowing) startAnimationLoop();

    return () => {
      isMounted = false;
    };
  }, [isGlowing]);

  return (
    <BaseButton style={style} onPress={onPress}>
      <View
        className='flex flex-col items-center justify-center overflow-hidden rounded-full border'
        style={{
          backgroundColor: opacity(backgroundColor, 75),
          width,
          height,
          borderColor: backgroundColor,
        }}
      >
        <Animated.View style={animatedGlowStyle}>
          <LinearGradient
            colors={[colors.primary, colors.questClaim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width, height, borderRadius: 99999 }}
          />
        </Animated.View>
        <FontAwesomeIcon
          icon={faChevronsRight}
          color={colors.textPrimary}
          size={adjust(10)}
        />
      </View>
    </BaseButton>
  );
});
