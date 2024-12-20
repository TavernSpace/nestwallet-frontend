import _ from 'lodash';
import LottieLight from 'react-lottie-player/dist/LottiePlayerLight';
import { LottieViewProps } from './types';

export default function LottieViewWeb(props: LottieViewProps) {
  const { autoplay, source, width, height, ...lottieProps } = props;
  const src = _.isString(source) ? source : source.uri;
  return (
    <LottieLight
      {...lottieProps}
      play={autoplay}
      path={src}
      style={{ width, height }}
    />
  );
}
