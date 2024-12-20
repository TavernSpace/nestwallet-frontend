import cn from 'classnames';
import { createContext, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Animated, {
  runOnJS,
  runOnUI,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SplashLottie from '../assets/animations/splash-lottie.json';
import LottieView from '../components/lottie-view';
import { View } from '../components/view';
import { colors, SCREEN_WIDTH } from '../design/constants';

interface ISplashContext {
  complete: boolean;
}

interface SplashContextProps {
  children: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const SplashContext = createContext<ISplashContext>({} as any);

export function SplashContextProvider(props: SplashContextProps) {
  const { children } = props;

  const [complete, setComplete] = useState(false);

  const opacity = useSharedValue(1);

  const handleAnimationFinish = () => {
    runOnUI(() => {
      opacity.value = withTiming(0, { duration: 300 }, () =>
        runOnJS(setComplete)(true),
      );
    })();
  };

  const webStyle = Platform.select({
    web: {
      'h-screen overflow-hidden': !complete,
    },
  });

  const context = useMemo(
    () => ({
      complete,
    }),
    [complete],
  );

  return (
    <SplashContext.Provider value={context}>
      <View className={cn('flex-1', webStyle)}>
        {children}
        {!complete && (
          <AnimatedView
            className='absolute flex h-full w-full items-center justify-center'
            style={{
              backgroundColor: colors.background,
              opacity: opacity,
              zIndex: 100,
            }}
          >
            <View style={{ height: 160, width: SCREEN_WIDTH - 160 }}>
              <LottieView
                animatedData={SplashLottie}
                autoplay
                loop={false}
                onAnimationFinish={handleAnimationFinish}
              />
            </View>
          </AnimatedView>
        )}
      </View>
    </SplashContext.Provider>
  );
}

export function useSplashContext() {
  return useContext(SplashContext);
}
