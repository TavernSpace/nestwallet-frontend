import {
  faMoneyCheckDollar,
  faSparkles,
  faWreathLaurel,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { adjust } from '../../../../common/utils/style';
import { ActivityIndicator } from '../../../../components/activity-indicator';
import { TextButton } from '../../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { SCREEN_HEIGHT, colors } from '../../../../design/constants';
import { getNestNftImage } from '../../../../features/nft/nest/utils';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import {
  IBlockchainType,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { walletDetailBottomTabOffset } from '../../navigation/tab-bar-floating';
import { MintCriteriaSheet } from './criteria-sheet/sheet';

interface WalletRewardsIntroProps {
  wallets: IWallet[];
  minting: boolean;
  handleMint: (wallet: IWallet) => void;
  onCreateWallet: VoidFunction;
}

export function WalletRewardsIntro(props: WalletRewardsIntroProps) {
  const { wallets, minting, handleMint, onCreateWallet } = props;

  const [showMintSheet, setShowMintSheet] = useState(false);

  const size = SCREEN_HEIGHT > 800 ? 300 : 225;

  const imageBounceDistance = 8;
  const imageBounceDuration = 800;
  const imageTranslationY = useSharedValue(0);

  const { top } = useSafeAreaInsets();

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      width: size,
      height: size,
      borderRadius: 16,
      paddingBottom: 10,
      transform: [
        {
          translateY: imageTranslationY.value,
        },
      ],
    };
  });

  const handleAnimateImage = () => {
    imageTranslationY.value = withRepeat(
      withTiming(imageBounceDistance, {
        duration: imageBounceDuration,
      }),
      -1,
      true,
    );
  };

  useEffect(() => {
    handleAnimateImage();
  }, []);

  return minting ? (
    <View
      className='h-full w-full'
      style={{ paddingBottom: walletDetailBottomTabOffset }}
    >
      <View className='flex h-full flex-col items-center justify-center space-y-4 px-4 py-6'>
        <Animated.Image
          source={{
            uri: getNestNftImage(1, true),
          }}
          style={animatedImageStyle}
        />
        <View className='flex flex-col pt-4'>
          <View className='bg-primary/10 flex w-fit flex-row items-center space-x-2 rounded-full px-3 py-2'>
            <ActivityIndicator size={adjust(14, 2)} />
            <Text className='text-primary text-center text-sm font-medium'>
              Minting your Nest
            </Text>
          </View>
        </View>
      </View>
    </View>
  ) : (
    <View
      className='flex h-full w-full flex-col'
      style={{
        paddingBottom: walletDetailBottomTabOffset,
      }}
    >
      <Text
        className='text-text-primary text-center text-base font-medium'
        style={{ paddingTop: Math.max(16, top) }}
      >
        Rewards Center
      </Text>
      <View className='flex flex-1 flex-col items-center justify-center space-y-4 px-4'>
        <Animated.Image
          source={{
            uri: getNestNftImage(1, true),
          }}
          style={animatedImageStyle}
        />
        <View className='bg-card flex w-full flex-col space-y-2 rounded-3xl px-4 py-4'>
          <View className='flex flex-col'>
            <Text className='text-text-primary text-center text-lg font-medium'>
              {'The Nest'}
            </Text>
            <Text className='text-text-secondary text-center text-base font-normal'>
              {'A Soulbound NFT'}
            </Text>
          </View>
          <View
            className={cn(
              'flex w-full flex-row flex-wrap items-center space-y-1 pt-2',
              { 'flex-1': Platform.OS === 'web' },
            )}
          >
            <View className='flex w-full flex-row flex-wrap items-center'>
              <Text className='text-text-secondary text-sm font-normal'>
                {'Mint your'}
              </Text>
              <View className='bg-primary/10 mx-1 mb-1 inline-flex flex-row items-center space-x-1 rounded-lg px-2 py-0.5'>
                <FontAwesomeIcon
                  icon={faWreathLaurel}
                  color={colors.primary}
                  size={adjust(12, 2)}
                />
                <Text className='text-primary text-sm font-normal'>
                  {'Nest'}
                </Text>
              </View>
              <Text className='text-text-secondary text-sm font-normal'>
                {'for'}
              </Text>
              <View className='bg-success/10 mx-1 mb-1 inline-flex flex-row items-center space-x-1 rounded-lg px-2 py-0.5'>
                <FontAwesomeIcon
                  icon={faMoneyCheckDollar}
                  color={colors.success}
                  size={adjust(12, 2)}
                />
                <Text className='text-success text-sm font-normal'>
                  {'Free'}
                </Text>
              </View>
              <Text className='text-text-secondary text-wrap text-sm font-normal'>
                {'and '}
              </Text>
              <Text className='text-text-secondary text-wrap text-sm font-normal'>
                {'embark '}
              </Text>
              <Text className='text-text-secondary text-wrap text-sm font-normal'>
                {'on '}
              </Text>
              <Text className='text-text-secondary text-wrap text-sm font-normal'>
                {'the'}
              </Text>
              <View className='bg-approve/10 mx-1 mb-1 inline-flex flex-row items-center justify-center space-x-1 rounded-lg px-2 py-0.5'>
                <FontAwesomeIcon
                  icon={faSparkles}
                  color={colors.approve}
                  size={adjust(12, 2)}
                />
                <Text className='text-approve text-sm font-normal'>
                  {'Nest Odyssey'}
                </Text>
              </View>
              <Text className='text-text-secondary text-sm font-normal'>
                {'today.'}
              </Text>
            </View>
            <View className='w-full pt-3'>
              <TextButton text='Begin' onPress={() => setShowMintSheet(true)} />
            </View>
          </View>
        </View>
      </View>
      <MintCriteriaSheet
        wallets={wallets.filter(
          (wallet) =>
            !wallet.hidden && wallet.blockchain === IBlockchainType.Evm,
        )}
        isShowing={showMintSheet}
        onClose={() => setShowMintSheet(false)}
        onSelectWallet={(wallet) => {
          setShowMintSheet(false);
          handleMint(wallet);
        }}
        onCreateWallet={() => {
          setShowMintSheet(false);
          onCreateWallet();
        }}
      />
    </View>
  );
}
