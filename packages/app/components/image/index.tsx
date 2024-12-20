import {
  Image as _ExpoImage,
  ImageLoadEventData,
  ImageProps,
} from 'expo-image';
import { styled } from 'nativewind';
import { useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { View } from '../view';

export const Image = styled(function (props: ImageProps) {
  const { source, style } = props;
  const opacity = useSharedValue(0);
  const minimumLoadTimeBeforeFade = 50;
  const startTime = Date.now();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleLoadEnd = () => {
    const endTime = Date.now();
    const loadDuration = endTime - startTime;

    opacity.value = withTiming(1, {
      duration: loadDuration <= minimumLoadTimeBeforeFade ? 0 : 250, //We don't wanna show a fade animation if the image loads quickly / cached
    });
  };

  const isUri =
    typeof source === 'object' &&
    !!source &&
    'uri' in source &&
    typeof source.uri === 'string';

  return (
    <View
      style={[
        style,
        { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      ]}
    >
      <Animated.View
        style={[animatedStyle, style, { width: '100%', height: '100%' }]}
      >
        <_ExpoImage
          responsivePolicy='initial'
          recyclingKey={isUri ? (source as any).uri : undefined}
          {...props}
          onLoadEnd={handleLoadEnd}
        />
      </Animated.View>
    </View>
  );
});

export const AutoHeightImage = styled(function (
  props: ImageProps & {
    width: number;
  },
) {
  const { width } = props;

  const [imageHeight, setImageHeight] = useState(1);

  const handleImageLoad = (event: ImageLoadEventData) => {
    setImageHeight((event.source.height / event.source.width) * width);
  };

  return (
    <Image
      {...props}
      onLoad={handleImageLoad}
      style={[props.style, { width, height: imageHeight }]}
    />
  );
});
