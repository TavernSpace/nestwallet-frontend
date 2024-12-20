// import { UserAvatar } from '@nestwallet/app/components/avatar/user-avatar';
import { faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { TextButton } from '@nestwallet/app/components/button/text-button';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { useRef, useState } from 'react';
import { Animated, ImageBackground } from 'react-native';
import MintImage from '../../../../assets/images/home/hero/background.png';
import { adjust } from '../../../../common/utils/style';
import { ActivityIndicator } from '../../../../components/activity-indicator';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { colors } from '../../../../design/constants';
import { adjustTextStyle } from '../../../../design/utils';

interface WalletRewardsLoadingProps {
  isMinting: boolean;
  hideSheet: VoidFunction;
}

export function WalletRewardsLoading(props: WalletRewardsLoadingProps) {
  const { isMinting, hideSheet } = props;

  const [textIndex, setTextIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const texts = [
    "In the world of crypto, there exists a unique NFT known as 'The Nest'.\n\nWhile intrinsically tied to Nest Wallet, The Nest isnt just an NFT, it's a living entity that evolves over time...",
    `Venture into The Nest, and complete the various quests to level up and gain rewards.\n\nIf you're lucky, you might discover OTTO, the ingenious otter who calls The Nest home.`,
    'Are you ready to dive into a world where cuteness meets craftiness? Your journey starts now...',
  ];

  const textBaseStyle = adjustTextStyle({
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  });

  const handleContinue = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View className='flex h-full w-full flex-1 flex-col'>
      <ImageBackground source={MintImage} className='flex-1'>
        <ActionSheetHeader onClose={hideSheet} type='fullscreen' />
        <View className='flex h-full w-full flex-1 flex-col items-center justify-between space-y-4'>
          <View className='items-center pt-8'>
            <View className='flex flex-col items-center space-y-1'>
              <Text className='text-text-primary text-base font-medium'>
                Introducing
              </Text>
              <Text className='text-primary text-2xl font-bold'>The Nest</Text>
            </View>
            <View className='items-center space-y-4 px-4 pt-12'>
              <View className='bg-card/60 h-36 rounded-2xl px-4 py-3'>
                <Animated.Text
                  allowFontScaling={false}
                  style={[{ opacity: fadeAnim }, textBaseStyle]}
                >
                  {texts[textIndex]}
                </Animated.Text>
              </View>
              {textIndex < texts.length - 1 && (
                <BaseButton onPress={handleContinue}>
                  <View className='bg-primary/10 flex flex-row items-center space-x-0.5 rounded-full px-3 py-1'>
                    <Text className='text-primary text-right text-sm font-normal'>
                      {'Continue'}
                    </Text>
                    <FontAwesomeIcon
                      icon={faAngleRight}
                      color={colors.primary}
                      size={adjust(12, 2)}
                    />
                  </View>
                </BaseButton>
              )}
            </View>
          </View>
          {isMinting ? (
            <View className='flex-row space-x-1'>
              <View className='bg-primary/10 flex flex-row items-center space-x-2 rounded-full px-3 py-1'>
                <ActivityIndicator size={adjust(14, 2)} />
                <Text className='text-primary text-center text-sm font-normal'>
                  Minting
                </Text>
              </View>
            </View>
          ) : textIndex < texts.length - 1 ? (
            <View className='bg-success/10 flex flex-row items-center rounded-full px-3 py-1'>
              <Text className='text-success text-center text-sm font-normal'>
                Mint Complete
              </Text>
            </View>
          ) : (
            <TextButton
              text={'Mint'}
              className='w-full px-4'
              loading={isMinting}
              disabled={isMinting}
              onPress={hideSheet}
            />
          )}
        </View>
      </ImageBackground>
    </View>
  );
}
