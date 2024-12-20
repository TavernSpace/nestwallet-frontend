import {
  faArrowDown,
  faArrowUp,
  faEye,
  faEyeSlash,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';
import { forwardRef, useRef, useState } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import Blob from '../../assets/images/blob.png';
import Share from '../../assets/images/share-primary.png';
import { formatMoney, formatPercentage } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { Blur } from '../../components/blur';
import { BaseButton } from '../../components/button/base-button';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { NestLight } from '../../components/logo/nest';
import { QRCode } from '../../components/qr';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { ICryptoBalance, IUser } from '../../graphql/client/generated/graphql';

export function ShareSheet(props: {
  isShowing: boolean;
  user: IUser;
  token: ICryptoBalance;
  costBasis: number;
  profitAbsolute: number;
  profitPercentage: number;
  onPressShare: (viewRef: React.MutableRefObject<null>) => Promise<void>;
  onClose: VoidFunction;
}) {
  const { isShowing, onClose, onPressShare } = props;

  const [isPrivate, setIsPrivate] = useState(false);

  const shareContentRef = useRef(null);

  const handlePressShare = async () => {
    await onPressShare(shareContentRef);
  };

  return (
    <>
      <ActionSheet
        isShowing={isShowing}
        onClose={onClose}
        isFullHeight={true}
        hasBottomInset={false}
        hasTopInset={true}
      >
        <ShareContent
          {...props}
          isPrivate={isPrivate}
          onShare={handlePressShare}
          onTogglePrivate={() => setIsPrivate(!isPrivate)}
        />
      </ActionSheet>
      <ShareImageContent
        ref={shareContentRef}
        isPrivate={isPrivate}
        {...props}
      />
    </>
  );
}

function ShareContent(props: {
  user: IUser;
  token: ICryptoBalance;
  costBasis: number;
  profitAbsolute: number;
  profitPercentage: number;
  isPrivate: boolean;
  onClose: VoidFunction;
  onShare: VoidFunction;
  onTogglePrivate: VoidFunction;
}) {
  const {
    user,
    token,
    costBasis,
    profitAbsolute,
    profitPercentage,
    isPrivate,
    onClose,
    onShare,
    onTogglePrivate,
  } = props;
  const { bottom } = useSafeAreaInsets();

  const innerView = (
    <View className='bg-card/50 border-card-highlight flex h-full w-full flex-col justify-between rounded-3xl border backdrop-blur-lg'>
      <View className='flex flex-col px-8 pt-4'>
        <View className='flex flex-row items-center justify-center space-x-4'>
          <CryptoAvatar
            url={token.tokenMetadata.imageUrl}
            symbol={token.tokenMetadata.symbol}
            chainId={token.chainId}
            size={adjust(48)}
          />
          <View className='flex flex-col'>
            <Text className='text-text-eyebrow text-sm font-normal'>
              {token.tokenMetadata.name}
            </Text>
            <Text className='text-text-primary text-3xl font-medium'>
              {token.tokenMetadata.symbol}
            </Text>
          </View>
        </View>

        <View className='flex flex-row items-center justify-between pt-6'>
          <View className='flex flex-col space-y-1'>
            <Text className='text-text-eyebrow text-sm font-normal'>
              {'INVESTED'}
            </Text>
            <Text className='text-text-primary text-2xl font-medium'>
              {isPrivate ? '＊＊＊＊' : formatMoney(costBasis)}
            </Text>
          </View>
          <View className='flex flex-col items-end space-y-1'>
            <Text className='text-text-eyebrow text-end text-sm font-normal'>
              {'VALUED AT'}
            </Text>
            <Text className='text-text-primary text-end text-2xl font-medium'>
              {isPrivate
                ? '＊＊＊＊'
                : formatMoney(
                    parseFloat(token.balanceInUSD),
                    NumberType.FiatTokenPrice,
                  )}
            </Text>
          </View>
        </View>
      </View>

      <View className='mt-3 flex flex-col justify-center space-y-2'>
        <View className='flex flex-col items-center justify-center space-y-1'>
          <View className='flex flex-row items-center justify-center space-x-2 rounded-full'>
            <FontAwesomeIcon
              icon={profitAbsolute < 0 ? faArrowDown : faArrowUp}
              color={profitAbsolute < 0 ? colors.failure : colors.success}
              size={adjust(26, 2)}
            />
            <Text
              className={cn('text-4xl font-bold', {
                'text-failure': profitAbsolute < 0,
                'text-success': profitAbsolute >= 0,
              })}
            >
              {formatPercentage(Math.abs(profitPercentage * 100))}
            </Text>
          </View>
          <View
            className={cn('items-center justify-center rounded-xl px-3 py-1', {
              'bg-failure/20': profitAbsolute < 0,
              'bg-success/20': profitAbsolute >= 0,
            })}
          >
            <Text
              className={cn('text-2xl font-medium', {
                'text-failure': profitAbsolute < 0,
                'text-success': profitAbsolute >= 0,
              })}
            >
              {isPrivate
                ? '＊＊＊＊'
                : `${profitAbsolute < 0 ? '-' : ''}${formatMoney(
                    Math.abs(profitAbsolute),
                  )}`}
            </Text>
          </View>
        </View>
      </View>

      <View className='flex flex-col pb-4'>
        {!!user.referralCode && (
          <View className='flex flex-row justify-between px-6'>
            <View className='flex flex-1 flex-col items-center justify-center'>
              <Text className='text-text-eyebrow text-center text-sm font-normal'>
                {'TRADE WITH 0% FEES'}
              </Text>
              <Text className='text-text-primary text-center text-lg font-medium'>
                {user.referralCode}
              </Text>
            </View>
            <View
              className='items-center justify-center rounded-[20px] bg-white'
              style={withSize(100)}
            >
              <QRCode
                logo={undefined}
                logoSize={0}
                value={`nestwallet.xyz/?referral=${user.referralCode}`}
                size={80}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className='flex h-full w-full flex-col'>
      <ActionSheetHeader
        adornment={
          <View className='flex flex-row items-center space-x-2'>
            <NestLight size={28} rounded={true} />
            <Text className='text-text-primary text-base font-medium'>
              {'Nest Wallet'}
            </Text>
          </View>
        }
        position='center'
        onClose={onClose}
        type='fullscreen'
      />
      <View className='flex w-full flex-1 flex-col'>
        <MetalBlob
          className='absolute -right-16 top-16'
          width={200}
          rotation={270}
        />
        <MetalBlob
          className='absolute bottom-0 right-0'
          width={140}
          rotation={0}
        />
        <MetalBlob
          className='absolute left-0 top-0'
          width={120}
          rotation={45}
        />
        <MetalBlob
          className='absolute -left-16 bottom-16'
          width={250}
          rotation={80}
        />
        <View className='absolute h-full w-full px-4'>
          {Platform.OS !== 'web' ? (
            <Blur
              className='overflow-hidden rounded-3xl'
              androidEnabled={true}
              intensity={36}
            >
              {innerView}
            </Blur>
          ) : (
            innerView
          )}
          <View
            className={cn('absolute h-full w-full', {
              'pr-8': Platform.OS === 'web',
              'ml-4': Platform.OS !== 'web',
            })}
          >
            <LinearGradient
              colors={[
                opacity(colors.primary, Platform.OS === 'android' ? 4 : 5),
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0.01, 1]}
              style={{
                borderRadius: 24,
                height: '100%',
                width: '100%',
              }}
            />
          </View>
        </View>
      </View>
      <View
        className='flex w-full flex-row space-x-4 px-4 pt-4'
        style={{ paddingBottom: bottom }}
      >
        <TextButton
          className='flex-1'
          text={Platform.OS === 'web' ? 'Download' : 'Share'}
          onPress={onShare}
        />
        <BaseButton onPress={onTogglePrivate}>
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-incognito/20': !isPrivate,
              'bg-approve/20': isPrivate,
            })}
            style={withSize(BUTTON_HEIGHT)}
          >
            <FontAwesomeIcon
              icon={!isPrivate ? faEyeSlash : faEye}
              size={adjust(20, 2)}
              color={!isPrivate ? colors.incognito : colors.approve}
            />
          </View>
        </BaseButton>
      </View>
    </View>
  );
}

const ShareImageContent = forwardRef(function (
  props: {
    isShowing: boolean;
    user: IUser;
    token: ICryptoBalance;
    costBasis: number;
    profitAbsolute: number;
    profitPercentage: number;
    isPrivate: boolean;
  },
  ref,
) {
  const {
    isShowing,
    user,
    token,
    costBasis,
    profitAbsolute,
    profitPercentage,
    isPrivate,
  } = props;

  return (
    <View
      className='pointer-events-none'
      pointerEvents='none'
      style={{
        position: 'absolute',
        left: -9999,
        top: -9999,
        backgroundColor: colors.background,
      }}
      ref={ref}
    >
      {isShowing && <Image source={Share} style={withSize(512)} />}
      {isShowing && (
        <View className='absolute h-[512px] w-[512px] items-center'>
          <View className='mt-[27px] flex h-[413px] w-[390px] flex-col justify-between rounded-[48px]'>
            <View className='flex flex-col pt-8'>
              <View className='flex flex-row items-center justify-center space-x-4'>
                <CryptoAvatar
                  url={token.tokenMetadata.imageUrl}
                  symbol={token.tokenMetadata.symbol}
                  size={adjust(48)}
                  chainId={token.chainId}
                  symbolAdjustment={Platform.OS === 'web' ? -12 : undefined}
                />
                <View
                  className={cn('flex flex-col -space-y-1', {
                    '-mt-4': Platform.OS === 'web',
                  })}
                >
                  <Text className='text-text-eyebrow text-sm font-normal'>
                    {token.tokenMetadata.name}
                  </Text>
                  <Text className='text-text-primary text-2xl font-medium'>
                    {token.tokenMetadata.symbol}
                  </Text>
                </View>
              </View>
              <View
                className={cn('flex flex-col items-center justify-center', {
                  'space-y-4 pt-10': Platform.OS === 'web',
                  'pt-8': Platform.OS !== 'web',
                })}
              >
                <View className='flex flex-row items-center justify-center space-x-2 rounded-full'>
                  <FontAwesomeIcon
                    icon={profitAbsolute < 0 ? faArrowDown : faArrowUp}
                    color={profitAbsolute < 0 ? colors.failure : colors.success}
                    size={36}
                  />
                  <View
                    className={cn('h-16 items-center justify-center', {
                      '-mt-12': Platform.OS === 'web',
                    })}
                  >
                    <Text
                      className={cn('text-6xl font-bold', {
                        'text-failure': profitAbsolute < 0,
                        'text-success': profitAbsolute >= 0,
                      })}
                    >
                      {formatPercentage(Math.abs(profitPercentage * 100))}
                    </Text>
                  </View>
                </View>
                <View
                  className={cn(
                    'h-9 items-center justify-center rounded-xl px-3',
                    {
                      'bg-failure/10': profitAbsolute < 0,
                      'bg-success/10': profitAbsolute >= 0,
                    },
                  )}
                >
                  <Text
                    className={cn('text-2xl font-medium', {
                      'text-failure': profitAbsolute < 0,
                      'text-success': profitAbsolute >= 0,
                      '-mt-5': Platform.OS === 'web',
                    })}
                  >
                    {isPrivate
                      ? '＊＊＊＊'
                      : `${profitAbsolute < 0 ? '-' : ''}${formatMoney(
                          Math.abs(profitAbsolute),
                        )}`}
                  </Text>
                </View>
              </View>
              <View
                className={cn(
                  'flex flex-row items-center justify-between px-8 pt-8',
                  {
                    'pt-8': Platform.OS === 'web',
                    'pt-4': Platform.OS !== 'web',
                  },
                )}
              >
                <View className='flex flex-col -space-y-1'>
                  <Text className='text-text-eyebrow text-sm font-normal'>
                    {'Invested'}
                  </Text>
                  <Text className='text-text-primary text-2xl font-medium'>
                    {isPrivate ? '＊＊＊＊' : formatMoney(costBasis)}
                  </Text>
                </View>
                <View className='flex flex-col items-end -space-y-1'>
                  <Text className='text-text-eyebrow text-end text-sm font-normal'>
                    {'Valued At'}
                  </Text>
                  <Text className='text-text-primary text-end text-2xl font-medium'>
                    {isPrivate
                      ? '＊＊＊＊'
                      : formatMoney(
                          parseFloat(token.balanceInUSD),
                          NumberType.FiatTokenPrice,
                        )}
                  </Text>
                </View>
              </View>
            </View>
            {!!user.referralCode && (
              <View
                className={cn('flex flex-row justify-between pb-4 pl-6 pr-16', {
                  'pt-2': Platform.OS !== 'web',
                })}
              >
                <View className='flex flex-1 flex-col items-center justify-center'>
                  <Text className='text-text-eyebrow text-center text-sm font-normal'>
                    {'Trade with 0% fees'}
                  </Text>
                  <Text className='text-text-primary text-center text-lg font-medium'>
                    {user.referralCode}
                  </Text>
                </View>
                <View
                  className='items-center justify-center rounded-[20px] bg-white'
                  style={withSize(80)}
                >
                  <QRCode
                    logo={undefined}
                    logoSize={0}
                    value={`nestwallet.xyz/?referral=${user.referralCode}`}
                    size={64}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

const MetalBlob = styled(function (props: {
  width: number;
  rotation: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width, rotation, style } = props;
  const imageRatio = 11 / 16;

  return (
    <View style={style}>
      <Image
        source={Blob}
        style={{
          width,
          height: width * imageRatio,
          transform: [{ rotate: `${rotation}deg` }],
        }}
      />
    </View>
  );
});
