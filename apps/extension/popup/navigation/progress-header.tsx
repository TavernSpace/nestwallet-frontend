import { faChevronLeft, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { ExpandingDot } from '@nestwallet/app/components/expanding-dot';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { StackHeaderProps } from '@react-navigation/stack';
import { useMemo } from 'react';
import { Animated } from 'react-native';

export function ProgressHeader(
  props: StackHeaderProps & {
    steps: string[];
  },
) {
  const { navigation, steps } = props;
  const stepsMap = useMemo(() => {
    return steps.reduce((prev, routeName, index) => {
      prev[routeName] = index;
      return prev;
    }, {} as Record<string, number>);
  }, [steps]);
  const offset = stepsMap[props.route.name] ?? 0;
  const progress = Animated.add(
    props.progress.current.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    props.progress.next
      ? props.progress.next.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0,
  ).interpolate({
    inputRange: [0, 1],
    outputRange: [offset, offset + 1],
  });

  return (
    <View
      className='bg-background flex flex-row items-center justify-between'
      style={{ height: 56 }}
    >
      <View className='flex flex-1 flex-row pl-4'>
        {navigation.canGoBack() && (
          <IconButton
            icon={faChevronLeft}
            size={18}
            onPress={navigation.goBack}
            color={colors.textPrimary}
          />
        )}
      </View>
      <View className='max-w-1/2'>
        <ExpandingDot
          data={steps}
          expandingDotWidth={15}
          scrollX={progress}
          dotStyle={{
            width: 6,
            height: 6,
            borderRadius: 3,
            marginHorizontal: 3,
          }}
        />
      </View>
      <View className='flex flex-1 flex-row justify-end pr-4'>
        {navigation.getParent()?.getParent()?.canGoBack() && (
          <IconButton
            icon={faTimes}
            size={20}
            onPress={navigation.getParent()?.getParent()?.goBack}
            color={colors.textPrimary}
          />
        )}
      </View>
    </View>
  );
}
