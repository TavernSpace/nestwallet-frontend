import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Loadable } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { SCREEN_WIDTH, colors } from '../../../design/constants';
import {
  IQuestEventInfo,
  IQuestGroupIdentifier,
  IQuestIdentifier,
  IQuestIdentifierType,
} from '../../../graphql/client/generated/graphql';
import { WindowType, useNestWallet } from '../../../provider/nestwallet';
import { BaseButton } from '../../button/base-button';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Image } from '../../image';
import { QuestListItemSkeleton } from '../../skeleton/list-item';
import { View } from '../../view';

type BannerCarouselProps = {
  eventInfo: Loadable<IQuestEventInfo[]>;
  style?: StyleProp<ViewStyle>;
  onQuestGroupAction: (groupID: IQuestGroupIdentifier) => void;
  onQuestAction: (questID: IQuestIdentifier) => void;
};

export const BannerCarousel = styled(function ({
  eventInfo,
  style,
  onQuestGroupAction,
  onQuestAction,
}: BannerCarouselProps) {
  const { windowType } = useNestWallet();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [width, setWidth] = useState(SCREEN_WIDTH - 32);
  const [pauseAutoSlide, setPauseAutoSlide] = useState(false);
  const slideTransition = useSharedValue(0);

  const contentWidth = width;
  const bannerHeight = 96;
  const dotWidth = 4;
  const buttonSize = adjust(12, 2);

  const numOfBanners = eventInfo.data ? eventInfo.data.length : 0;

  const animatedSlideStyle = useAnimatedStyle(() => ({
    width: contentWidth * numOfBanners,
    transform: [
      { translateX: withTiming(slideTransition.value * -contentWidth) },
    ],
  }));

  const handleUserInteraction = (action: () => void) => {
    action();
    setPauseAutoSlide(true);
    setTimeout(() => {
      setPauseAutoSlide(false);
    }, 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % numOfBanners);
    slideTransition.value = (slideTransition.value + 1) % numOfBanners;
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + numOfBanners) % numOfBanners,
    );
    slideTransition.value =
      (slideTransition.value - 1 + numOfBanners) % numOfBanners;
  };

  const handleBannerPress = (event: IQuestEventInfo) => {
    event.type === IQuestIdentifierType.Group
      ? onQuestGroupAction(event.id as IQuestGroupIdentifier)
      : onQuestAction(event.id as IQuestIdentifier);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!pauseAutoSlide) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pauseAutoSlide, currentSlide, numOfBanners]);

  return onLoadable(eventInfo)(
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton />
      </View>
    ),
    () => null,
    (eventInfo) => {
      const sortedEventInfo = [...eventInfo].sort(
        (a, b) => b.priority - a.priority,
      );
      return (
        <View
          style={style}
          onLayout={
            windowType === WindowType.sidepanel
              ? (e) => setWidth(e.nativeEvent.layout.width)
              : undefined
          }
        >
          <View
            style={[{ width: contentWidth }]}
            className='flex-none overflow-hidden rounded-xl'
          >
            <Animated.View
              style={[{ flexDirection: 'row' }, animatedSlideStyle]}
            >
              {sortedEventInfo.map((event, index) => (
                <BaseButton
                  key={index}
                  onPress={() => handleBannerPress(event)}
                >
                  <Image
                    source={event.banner}
                    style={{ width: contentWidth, height: bannerHeight }}
                  />
                </BaseButton>
              ))}
            </Animated.View>

            <View className='absolute left-0'>
              <ArrowButton
                icon={faChevronLeft}
                size={buttonSize}
                clickableWidth={contentWidth * 0.12}
                clickableHeight={bannerHeight}
                onPress={() => handleUserInteraction(prevSlide)}
                color={colors.textPrimary}
              />
            </View>

            <View className='absolute bottom-1 w-full items-center'>
              <View className='bg-card/40 rounded-full p-1'>
                <View className='flex-row'>
                  {sortedEventInfo.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        {
                          width: dotWidth,
                          height: dotWidth,
                          borderRadius: dotWidth / 2,
                          marginHorizontal: 2,
                        },
                        currentSlide === index
                          ? { backgroundColor: colors.textPrimary }
                          : { backgroundColor: colors.textSecondary },
                      ]}
                      onPress={() => {
                        setCurrentSlide(index);
                        slideTransition.value = index;
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View className='absolute right-0'>
              <ArrowButton
                icon={faChevronRight}
                size={buttonSize}
                clickableWidth={contentWidth * 0.12}
                clickableHeight={bannerHeight}
                onPress={() => handleUserInteraction(nextSlide)}
                color={colors.textPrimary}
              />
            </View>
          </View>
        </View>
      );
    },
  );
});

type ArrowButtonProps = {
  icon: IconProp;
  color?: string;
  size: number;
  clickableWidth: number;
  clickableHeight: number;
  adornment?: React.ReactNode;
  onPress: () => void;
};

const ArrowButton = (props: ArrowButtonProps) => {
  const { icon, color, size, clickableWidth, clickableHeight, onPress } = props;
  return (
    <BaseButton
      onPress={onPress}
      rippleEnabled={false}
      className='flex h-full w-full items-center justify-center'
    >
      <View
        style={{
          width: clickableWidth,
          height: clickableHeight,
        }}
        className='flex items-center justify-center'
      >
        <View className='bg-card flex items-center justify-center rounded-full p-1'>
          <FontAwesomeIcon icon={icon} color={color} size={size} />
        </View>
      </View>
    </BaseButton>
  );
};
