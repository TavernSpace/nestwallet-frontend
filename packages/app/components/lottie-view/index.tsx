import LottieLight from 'react-lottie-player/dist/LottiePlayerLight';
import { LottieViewProps } from './types';

export default function LottieView(props: LottieViewProps) {
  const {
    autoplay,
    path,
    animatedData,
    width,
    height,
    onAnimationFinish,
    ...lottieProps
  } = props;
  return (
    <LottieLight
      {...lottieProps}
      play={autoplay}
      path={path}
      speed={1}
      animationData={animatedData}
      style={{ width, height }}
      onComplete={onAnimationFinish}
    />
  );
}
