import RNLottieView, { AnimationObject } from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { LottieViewProps } from './types';

export default function LottieView(props: LottieViewProps) {
  const { autoplay, loop, path, animatedData, width, height, ...lottieProps } =
    props;
  const [lottie, setLottie] = useState(animatedData as AnimationObject);

  useEffect(() => {
    if (path) {
      fetch(path)
        .then((resp) => resp.json())
        .then((data) => setLottie(data));
    }
  }, [path]);

  return (
    <RNLottieView
      {...lottieProps}
      autoPlay={autoplay}
      loop={loop}
      source={lottie}
      style={{ width, height }}
    />
  );
}
