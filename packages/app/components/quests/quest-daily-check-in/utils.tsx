import { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export const useParticleAnimation = ({
  isCurrent = true,
  claimable = true,
  particleAmount = 6,
  particleDelay = 300,
  //Not the best variable names :(
  xMax = 100,
  xMin = 50,
  yMax = 100,
  yMin = 70,
}) => {
  const particles = Array.from({ length: particleAmount }).map(() => ({
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
    if (isCurrent && claimable) {
      const intervals: NodeJS.Timeout[] = [];
      particles.forEach((particle, index) => {
        const moveParticle = () => {
          particle.translateX.value = 0;
          particle.translateY.value = 0;
          particle.opacity.value = 1;

          particle.translateX.value = withTiming(Math.random() * xMax - xMin, {
            duration: 3000,
          });
          particle.translateY.value = withTiming(Math.random() * yMax - yMin, {
            duration: 3000,
          });
          particle.opacity.value = withTiming(0, { duration: 4000 });
        };

        const delay = index * particleDelay;
        setTimeout(moveParticle, delay);

        const intervalId = setInterval(moveParticle, 2000 + delay);
        intervals.push(intervalId);
      });

      return () => {
        intervals.forEach(clearInterval);
      };
    }
    return;
  }, [isCurrent, claimable, particles]);

  return particles;
};
