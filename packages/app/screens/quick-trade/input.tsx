import { faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { faArrowsLeftRight, faRefresh } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { memo, useState } from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import {
  formatCrypto,
  formatMoney,
  formatPercentage,
} from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { Loadable, VoidPromiseFunction } from '../../common/types';
import {
  loadableEq,
  makeLoadableLoading,
  onLoadable,
} from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { RawTextInput } from '../../components/text-input';
import { View } from '../../components/view';
import { SCREEN_HEIGHT, colors } from '../../design/constants';
import { ChainInfo } from '../../features/chain';
import { validDecimalAmount } from '../../features/crypto/transfer';
import { SwappableTokens } from '../../features/swap/types';
import {
  IBlockchainType,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';
import { AssetSelect } from '../../molecules/select/asset-select';
import { useAudioContext } from '../../provider/audio';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';
import { QuickTradeMode } from './types';

interface AssetInputProps {
  asset?: ICryptoBalance;
  hasPrimary: boolean;
  amount: string;
  value: string;
  editable: boolean;
  mode: QuickTradeMode;
  adornment?: React.ReactNode;
  onPress: VoidFunction;
  onChangeAmount: (amount: string) => void;
  onExpand: VoidFunction;
  style?: StyleProp<ViewStyle>;
}

function arePropsEqual(prev: AssetInputProps, cur: AssetInputProps) {
  return (
    prev.amount === cur.amount &&
    prev.value === cur.value &&
    prev.editable === cur.editable &&
    prev.asset === cur.asset &&
    prev.hasPrimary === cur.hasPrimary &&
    prev.mode === cur.mode &&
    prev.adornment === cur.adornment &&
    prev.onChangeAmount === cur.onChangeAmount
  );
}

export const AssetInput = memo(
  styled(function (props: AssetInputProps) {
    const {
      asset,
      amount,
      value,
      editable,
      mode,
      adornment,
      onPress,
      onChangeAmount,
      onExpand,
      style,
    } = props;
    const { language } = useLanguageContext();
    const { pressSound } = useAudioContext().sounds;

    const handleChangeAmount = (value: string) => {
      if (asset) {
        onChangeAmount(validDecimalAmount(value, asset.tokenMetadata.decimals));
      }
    };

    const balance = asset
      ? formatCrypto(asset.balance, asset.tokenMetadata.decimals)
      : '0';

    return (
      <View className='flex flex-col space-y-2' style={style}>
        <View className='flex flex-row items-center justify-between'>
          <Text className='text-text-secondary text-xs font-medium'>
            {mode === 'buy' ? 'Buy with:' : 'Sell token:'}
          </Text>
          {asset && (
            <Text className='text-text-secondary text-xs font-medium'>
              {`Balance: ${balance} ${asset.tokenMetadata.symbol}`}
            </Text>
          )}
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <View className='bg-card-highlight flex-1 justify-center rounded-2xl px-4'>
            <View className='flex flex-row items-center'>
              <View className='flex flex-1 flex-col'>
                <View className='h-12'>
                  <RawTextInput
                    className='text-text-primary h-12 w-full bg-transparent text-base outline-none'
                    id={'swap_secondary_amount'}
                    placeholder={'0.0'}
                    editable={!!asset && editable}
                    placeholderTextColor={colors.textPlaceholder}
                    value={amount}
                    autoComplete='off'
                    inputMode='decimal'
                    lineHeightAdjustment={adjust(-4, 2)}
                    numberOfLines={1}
                    onChangeText={handleChangeAmount}
                    onFocus={onExpand}
                  />
                </View>
              </View>

              <BaseButton
                className='pl-2'
                onPress={onPress}
                pressSound={pressSound}
                disabled={mode === 'sell'}
              >
                <View className='flex flex-row items-center space-x-2'>
                  {asset ? (
                    <CryptoAvatar
                      size={adjust(24, 2)}
                      url={asset.tokenMetadata.imageUrl}
                      symbol={asset.tokenMetadata.symbol}
                      chainId={asset.chainId}
                      chainBorderColor={colors.cardHighlight}
                    />
                  ) : (
                    <View
                      className='bg-card-highlight-secondary items-center justify-center rounded-full'
                      style={withSize(adjust(24, 2))}
                    />
                  )}
                  <View className='flex flex-row items-center space-x-1'>
                    <Text className='text-text-primary truncate text-sm font-medium'>
                      {asset?.tokenMetadata.symbol ??
                        localization.from[language]}
                    </Text>
                    {mode === 'buy' && (
                      <FontAwesomeIcon
                        icon={faAngleRight}
                        size={adjust(14, 2)}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                </View>
              </BaseButton>
            </View>
          </View>
          {adornment}
        </View>
      </View>
    );
  }),
  arePropsEqual,
);

interface PriceInputProps {
  marketPrice: Loadable<string | null>;
  mode: QuickTradeMode;
  price: string;
  percentage: string;
  entryType: 'percent' | 'amount';
  editable: boolean;
  adornment?: React.ReactNode;
  style?: StyleProp<ViewProps>;
  onPriceChange: (amount: string) => void;
  onRefresh: VoidPromiseFunction;
  onPercentageChange: (percentage: string) => void;
  onEntryTypeChange: (type: 'percent' | 'amount') => void;
  onExpand: VoidFunction;
}

export const PriceInput = memo(
  styled(function (props: PriceInputProps) {
    const {
      marketPrice,
      mode,
      price,
      percentage,
      entryType,
      editable,
      adornment,
      onPriceChange,
      onRefresh,
      onPercentageChange,
      onEntryTypeChange,
      onExpand,
      style,
    } = props;

    const [loading, setLoading] = useState(false);

    const handlePriceChange = (value: string) => {
      if (entryType === 'amount') {
        onPriceChange(validDecimalAmount(value));
      } else {
        onPercentageChange(validDecimalAmount(value, 2));
      }
    };

    const handleRefresh = async () => {
      try {
        setLoading(true);
        await onRefresh();
      } catch {
        // TODO: add error handling
      } finally {
        setLoading(false);
      }
    };

    const percentageFloat = parseFloat(percentage);
    const incrementDisabled = mode === 'buy' && percentageFloat >= 100;
    const decrementDisabled =
      (mode === 'sell' && percentageFloat <= 100) || percentageFloat === 0;

    return (
      <View className='flex flex-col' style={style}>
        {onLoadable(marketPrice)(
          () => (
            <View className='flex flex-row pb-2'>
              <Skeleton height={adjust(16, 2)} width='100%' borderRadius={6} />
            </View>
          ),
          () => (
            <View className='flex flex-row pb-2'>
              <Text className='text-text-secondary text-xs font-normal'>
                {'Unable to get market price'}
              </Text>
            </View>
          ),
          (marketPrice) => {
            const isAbove = parseFloat(price) >= parseFloat(marketPrice ?? '0');
            return !marketPrice ? (
              <View className='flex flex-row pb-2'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {'Unable to get market price'}
                </Text>
              </View>
            ) : (
              <View className='mb-2 flex flex-row items-center justify-between'>
                <View className='flex flex-row items-center space-x-1'>
                  <Text className='text-text-secondary text-xs font-normal'>
                    {'Market'}
                  </Text>
                  <Text className='text-text-primary text-xs font-normal'>
                    {marketPrice
                      ? formatMoney(
                          parseFloat(marketPrice),
                          NumberType.FiatTokenExactPrice,
                        )
                      : formatMoney(0)}
                  </Text>
                </View>
                {price !== '' && !!marketPrice && (
                  <View className='flex flex-row items-center'>
                    <Text className='text-text-secondary text-xs font-normal'>
                      <Text
                        className={cn('text-xs font-normal', {
                          'text-success': isAbove,
                          'text-failure': !isAbove,
                        })}
                      >
                        {formatPercentage(
                          100 *
                            Math.abs(
                              1 - parseFloat(price) / parseFloat(marketPrice),
                            ),
                        )}
                      </Text>
                      <Text className='text-text-secondary text-xs font-normal'>
                        {` ${isAbove ? 'above' : 'below'} market`}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        )}
        <View className='flex flex-row items-center space-x-2'>
          <View className='bg-card-highlight flex flex-1 flex-col rounded-2xl'>
            <View className='flex h-12 flex-row items-center space-x-2 px-4 '>
              <Text className='text-text-secondary text-base font-normal'>
                {entryType === 'amount' ? '$' : '%'}
              </Text>
              <RawTextInput
                className='text-text-primary w-full flex-1 bg-transparent text-base outline-none'
                id={'limit_price_amount'}
                placeholder={entryType === 'amount' ? '0.0' : '0'}
                editable={editable}
                placeholderTextColor={colors.textPlaceholder}
                value={entryType === 'amount' ? price : percentage}
                autoComplete='off'
                inputMode='decimal'
                lineHeightAdjustment={adjust(-4, 2)}
                onChangeText={handlePriceChange}
                onFocus={onExpand}
              />
              {marketPrice.error || marketPrice.data === null || loading ? (
                <BaseButton onPress={handleRefresh}>
                  <View
                    className='bg-card-highlight-secondary items-center justify-center rounded-lg'
                    style={withSize(adjust(24, 2))}
                  >
                    {loading ? (
                      <ActivityIndicator
                        size={adjust(12, 2)}
                        color={colors.textSecondary}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faRefresh}
                        size={adjust(12, 2)}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                </BaseButton>
              ) : (
                <BaseButton
                  onPress={() =>
                    onEntryTypeChange(
                      entryType === 'amount' ? 'percent' : 'amount',
                    )
                  }
                >
                  <View
                    className='bg-card-highlight-secondary items-center justify-center rounded-lg'
                    style={withSize(adjust(24, 2))}
                  >
                    <FontAwesomeIcon
                      icon={faArrowsLeftRight}
                      size={adjust(12, 2)}
                      color={colors.textSecondary}
                    />
                  </View>
                </BaseButton>
              )}
            </View>
          </View>
          <BaseButton
            onPress={() =>
              onPercentageChange(
                Math.max(
                  percentageFloat - 5,
                  mode === 'sell' ? 100 : 0,
                ).toString(),
              )
            }
            disabled={decrementDisabled}
          >
            <View
              className={cn(
                'bg-failure/10 h-12 w-12 items-center justify-center rounded-xl',
                { 'opacity-30': decrementDisabled },
              )}
            >
              <Text className='text-failure text-sm font-medium'>{'-5%'}</Text>
            </View>
          </BaseButton>
          <BaseButton
            onPress={() =>
              onPercentageChange(
                Math.min(
                  percentageFloat + 5,
                  mode === 'buy' ? 100 : percentageFloat + 5,
                ).toString(),
              )
            }
            disabled={incrementDisabled}
          >
            <View
              className={cn(
                'bg-success/10 h-12 w-12 items-center justify-center rounded-xl',
                { 'opacity-30': incrementDisabled },
              )}
            >
              <Text className='text-success text-sm font-medium'>{'+5%'}</Text>
            </View>
          </BaseButton>
          {adornment}
        </View>
      </View>
    );
  }),
);

interface TokenAssetSheetProps {
  blockchain: IBlockchainType;
  tokens: Loadable<ICryptoBalance[] | SwappableTokens>;
  chainId?: number;
  chains?: ChainInfo[];
  searchDisabled?: boolean;
  isShowing: boolean;
  onSelectAsset: (asset: ICryptoBalance) => void;
  onClose: VoidFunction;
}

function areSheetPropsEqual(
  prev: TokenAssetSheetProps,
  cur: TokenAssetSheetProps,
) {
  return (
    prev.isShowing === cur.isShowing &&
    prev.chains === cur.chains &&
    prev.chainId === cur.chainId &&
    loadableEq(prev.tokens, cur.tokens) &&
    prev.blockchain === cur.blockchain &&
    prev.searchDisabled === cur.searchDisabled
  );
}

export const TokenAssetSheet = memo(function (props: TokenAssetSheetProps) {
  const {
    blockchain,
    tokens,
    chains,
    chainId,
    onSelectAsset,
    isShowing,
    searchDisabled = false,
    onClose,
  } = props;
  const { pressSound } = useAudioContext().sounds;
  const { language } = useLanguageContext();

  const [hasOpened, setHasOpened] = useState(false);

  return (
    <ActionSheet
      isFullHeight={true}
      hasTopInset={true}
      hasBottomInset={false}
      isShowing={isShowing}
      onClose={onClose}
      onAfterOpen={() => setHasOpened(true)}
    >
      <View className='h-full'>
        <ActionSheetHeader
          title={localization.selectToken[language]}
          closeSound={pressSound}
          onClose={onClose}
          type='fullscreen'
        />
        <AssetSelect
          blockchain={blockchain}
          cryptos={hasOpened ? tokens : makeLoadableLoading()}
          onChange={(crypto) => {
            onSelectAsset(crypto as ICryptoBalance);
            onClose();
          }}
          chainIdOverride={chainId}
          estimatedHeight={SCREEN_HEIGHT * 0.75}
          chains={chains}
          searchUnknown={!searchDisabled}
          hideNFTs={true}
          maxItems={25}
        />
      </View>
    </ActionSheet>
  );
}, areSheetPropsEqual);
