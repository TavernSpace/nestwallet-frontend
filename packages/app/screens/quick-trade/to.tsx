import {
  faAngleRight,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowDownToLine,
  faArrowRightArrowLeft,
  faCoinFront,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isNil } from 'lodash';
import { styled } from 'nativewind';
import { memo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  formatCrypto,
  formatCryptoFloat,
  formatMoney,
  formatPercentage,
} from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { Loadable } from '../../common/types';
import { tuple } from '../../common/utils/functions';
import {
  composeLoadables,
  loadableEq,
  mapLoadable,
  onLoadable,
} from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { SwapRoute } from '../../features/swap/types';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';
import { useAudioContext } from '../../provider/audio';
import { useLanguageContext } from '../../provider/language';
import { computeSwapRate } from '../swap/utils';
import { localization } from './localization';
import { QuickTradeMode } from './types';

interface ToAssetProps {
  asset?: ICryptoBalance;
  mode: QuickTradeMode;
  route: Loadable<SwapRoute | null>;
  amount: Loadable<string>;
  value: Loadable<string>;
  hidePrice?: boolean;
  onSelectAsset?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}

export const ToAsset = memo(
  styled(function (props: ToAssetProps) {
    const {
      asset,
      mode,
      route,
      amount,
      value,
      hidePrice = false,
      onSelectAsset,
      style,
    } = props;
    const { language } = useLanguageContext();
    const { pressSound } = useAudioContext().sounds;

    const [invertRate, setInvertRate] = useState(false);

    const rate = mapLoadable(route)((route) =>
      route ? computeSwapRate(route) : null,
    );
    const priceRatio = mapLoadable(route)((route) => {
      if (!route) return null;
      const fromPrice = parseFloat(route.data.fromAmountUSD);
      const toPrice = parseFloat(route.data.toAmountUSD);
      return isNaN(fromPrice) ||
        isNaN(toPrice) ||
        fromPrice === 0 ||
        toPrice === 0
        ? null
        : toPrice / fromPrice;
    });

    return (
      <View className='flex flex-col' style={style}>
        {mode === 'sell' && (
          <BaseButton onPress={onSelectAsset} pressSound={pressSound}>
            <View className='flex flex-row items-center justify-between py-2'>
              <View className='flex flex-row items-center space-x-2'>
                <View
                  className='items-center justify-center rounded-full'
                  style={withSize(adjust(16, 2))}
                >
                  <FontAwesomeIcon
                    icon={faCoinFront}
                    size={adjust(12, 2)}
                    color={colors.textSecondary}
                  />
                </View>
                <Text className='text-text-secondary text-xs font-medium'>
                  {'Sell into'}
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-1'>
                <View className='bg-card-highlight flex flex-row items-center space-x-1 rounded-full px-2 py-1'>
                  {asset ? (
                    <CryptoAvatar
                      size={adjust(16, 2)}
                      url={asset.tokenMetadata.imageUrl}
                      symbol={asset.tokenMetadata.symbol}
                      chainBorderColor={colors.cardHighlight}
                    />
                  ) : (
                    <View
                      className='bg-card-highlight-secondary items-center justify-center rounded-full'
                      style={withSize(adjust(16, 2))}
                    />
                  )}
                  <View className='flex flex-row items-center space-x-1'>
                    <Text className='text-text-primary truncate text-xs font-normal'>
                      {asset?.tokenMetadata.symbol ?? localization.to[language]}
                    </Text>
                    {mode === 'sell' && (
                      <FontAwesomeIcon
                        icon={faAngleRight}
                        size={adjust(12, 2)}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>
          </BaseButton>
        )}
        <View
          className={cn('flex flex-row items-center justify-between', {
            'py-2': mode === 'buy',
            'pb-2': mode === 'sell',
          })}
        >
          {onLoadable(composeLoadables(amount, value)(tuple))(
            () => (
              <View className='flex flex-row items-center space-x-2'>
                <View
                  className='items-center justify-center rounded-full'
                  style={withSize(adjust(16, 2))}
                >
                  <FontAwesomeIcon
                    icon={faArrowDownToLine}
                    size={adjust(12, 2)}
                    color={colors.textSecondary}
                  />
                </View>
                <Text className='text-text-secondary text-xs font-medium'>
                  {localization.received[language]}
                </Text>
              </View>
            ),
            () => null,
            ([amount, value]) =>
              amount !== '' ? (
                <View className='flex flex-row items-center space-x-2'>
                  <View
                    className='items-center justify-center rounded-full'
                    style={withSize(adjust(16, 2))}
                  >
                    <FontAwesomeIcon
                      icon={faArrowDownToLine}
                      size={adjust(12, 2)}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text className='text-text-secondary text-xs font-medium'>
                    {localization.received[language]}
                  </Text>
                </View>
              ) : null,
          )}

          {onLoadable(composeLoadables(amount, value)(tuple))(
            () => (
              <Skeleton
                height={adjust(24, 2)}
                width={120}
                borderRadius={9999}
              />
            ),
            () => null,
            ([amount, value]) => (
              <View className='flex flex-row items-center space-x-1'>
                <View className='flex flex-row items-center space-x-2'>
                  {!hidePrice && value !== '' && asset && (
                    <View className='bg-card-highlight rounded-full px-2 py-1'>
                      <Text className='text-text-secondary text-xs font-normal'>
                        {formatMoney(parseFloat(value))}
                      </Text>
                    </View>
                  )}
                  {asset && amount !== '' && (
                    <View className='bg-card-highlight rounded-full px-2 py-1'>
                      <Text className='text-text-secondary text-xs font-normal'>
                        {`${formatCrypto(
                          amount,
                          asset.tokenMetadata.decimals,
                          NumberType.TokenExact,
                        )} ${asset.tokenMetadata.symbol}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ),
          )}
        </View>
        {onLoadable(composeLoadables(route, priceRatio)(tuple))(
          () => null,
          () => null,
          ([route, priceRatio]) =>
            !route ? null : (
              <View className='flex flex-row items-center justify-between'>
                <View className='flex flex-row items-center space-x-2'>
                  <View
                    className='items-center justify-center rounded-full'
                    style={withSize(adjust(16, 2))}
                  >
                    <FontAwesomeIcon
                      icon={faArrowRightArrowLeft}
                      size={adjust(12, 2)}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text className='text-text-secondary text-xs font-medium'>
                    {localization.rate[language]}
                  </Text>
                </View>
                <View className='flex flex-row items-center space-x-2'>
                  <BaseButton onPress={() => setInvertRate(!invertRate)}>
                    <View className='flex flex-row items-center space-x-1'>
                      <Text className='text-text-primary text-xs font-normal'>
                        {`${
                          !invertRate
                            ? 1
                            : rate.data
                            ? formatCryptoFloat(
                                1 / rate.data,
                                NumberType.TokenExact,
                              )
                            : 0
                        } ${route.data.fromToken.symbol}`}
                      </Text>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        size={adjust(10, 2)}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-xs font-normal'>
                        {`${
                          invertRate
                            ? 1
                            : formatCryptoFloat(
                                rate.data ? rate.data : 0,
                                NumberType.TokenExact,
                              )
                        } ${route.data.toToken.symbol}`}
                      </Text>
                    </View>
                  </BaseButton>
                  {!isNil(priceRatio) && (
                    <View
                      className={cn('rounded-full px-2 py-1', {
                        'bg-success/10': priceRatio >= 1.01,
                        'bg-card-highlight':
                          priceRatio >= 0.95 && priceRatio < 1.01,
                        'bg-warning/10': priceRatio < 0.95 && priceRatio > 0.8,
                        'bg-failure/10': priceRatio <= 0.8,
                      })}
                    >
                      <Text
                        className={cn('text-xs font-normal', {
                          'text-success': priceRatio >= 1.01,
                          'text-text-secondary':
                            priceRatio >= 0.95 && priceRatio < 1.01,
                          'text-warning': priceRatio < 0.95 && priceRatio > 0.8,
                          'text-failure': priceRatio <= 0.8,
                        })}
                      >
                        {priceRatio >= 1
                          ? `+${formatPercentage((priceRatio - 1) * 100)}`
                          : `-${formatPercentage((1 - priceRatio) * 100)}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ),
        )}
      </View>
    );
  }),
  (prev, cur) =>
    prev.asset === cur.asset &&
    prev.mode === cur.mode &&
    loadableEq(prev.amount, cur.amount) &&
    loadableEq(prev.value, cur.value) &&
    loadableEq(prev.route, cur.route) &&
    prev.style === cur.style,
);
