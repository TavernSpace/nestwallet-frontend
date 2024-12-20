export interface LottieViewProps {
  autoplay: boolean;
  loop: boolean;
  playCount?: number;
  path?: string;
  animatedData?: object;
  height?: number;
  width?: number;
  onAnimationFinish?: VoidFunction;
}
