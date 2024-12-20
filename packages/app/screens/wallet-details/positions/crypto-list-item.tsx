import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../../common/format/address';
import {
  formatCrypto,
  formatMoney,
  formatPercentage,
} from '../../../common/format/number';
import { Preferences } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { getChainInfo } from '../../../features/chain';
import { computeAggregatePNL } from '../../../features/crypto/balance';
import {
  IContractVisibility,
  ICryptoBalance,
} from '../../../graphql/client/generated/graphql';

// TODO: handle case where user has all of an asset in a position in one chain, and the same asset in another chain in their wallet
export function CryptoListItem(props: {
  balance: ICryptoBalance;
  groupedBalances: ICryptoBalance[];
  managed: boolean;
  expanded: boolean;
  hidden: boolean;
  hiddenGroup: boolean[];
  preferences: Preferences;
  onPress: (balance: ICryptoBalance) => void;
  onVisibilityPress: (
    balances: ICryptoBalance[],
    visibility: IContractVisibility,
  ) => void;
  onExpand: VoidFunction;
}) {
  const {
    balance,
    groupedBalances,
    managed,
    expanded,
    hidden,
    hiddenGroup,
    preferences,
    onPress,
    onVisibilityPress,
    onExpand,
  } = props;
  const { name, symbol, imageUrl, decimals } = balance.tokenMetadata;

  const decompose = managed || expanded;
  const isGroup = groupedBalances.length > 1;
  const size = adjust(36);
  const childSize = adjust(28);

  const handleVisibilityPress = (
    balances: ICryptoBalance[],
    hidden: boolean,
  ) => {
    onVisibilityPress(
      balances,
      hidden ? IContractVisibility.Shown : IContractVisibility.Hidden,
    );
  };

  const handlePress = () => {
    if (managed) {
      handleVisibilityPress(isGroup ? groupedBalances : [balance], hidden);
    } else if (isGroup) {
      onExpand();
    } else {
      onPress(balance);
    }
  };

  return (
    <View className='flex flex-col'>
      <ListItem onPress={handlePress}>
        <View
          className={cn(
            'flex flex-row items-center justify-between space-x-2 px-4 py-3',
            { 'opacity-50': hidden },
          )}
        >
          <View className='flex flex-1 flex-row items-center space-x-4'>
            <CryptoAvatar
              url={imageUrl}
              chainId={balance.chainId}
              tokens={groupedBalances}
              size={size}
              symbol={symbol}
            />
            <View className='flex flex-1 flex-col pr-4'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {name ? name : formatAddress(balance.address)}
              </Text>
              <Text
                className='text-text-secondary flex items-center truncate text-xs font-normal'
                numberOfLines={1}
              >
                <Text
                  className={cn('text-xs font-normal', {
                    'tracking-lighter': preferences.stealthMode,
                  })}
                >
                  {preferences.stealthMode
                    ? '﹡﹡﹡﹡'
                    : formatCrypto(balance.balance, decimals)}
                </Text>
                <Text className='ml-1 text-xs'>{` ${symbol}`}</Text>
              </Text>
            </View>
          </View>
          <View className='flex flex-row items-center space-x-4'>
            <View className='flex-shrink-0 flex-col items-end text-right'>
              <Text
                className={cn('text-text-primary text-sm font-medium', {
                  'tracking-tighter': preferences.stealthMode,
                })}
              >
                {preferences.stealthMode
                  ? '﹡﹡﹡﹡'
                  : formatMoney(parseFloat(balance.balanceInUSD))}
              </Text>
              {preferences.profitLoss === 'daily' ? (
                <TodaysReturnRow
                  balance={balance}
                  stealthMode={preferences.stealthMode}
                />
              ) : (
                <TotalReturnRow
                  balance={balance}
                  groupedBalances={groupedBalances}
                  stealthMode={preferences.stealthMode}
                />
              )}
            </View>
            {managed && (
              <View
                className='bg-card-highlight items-center justify-center rounded-full'
                style={withSize(adjust(22, 2))}
              >
                <FontAwesomeIcon
                  icon={hidden ? faEyeSlash : faEye}
                  color={colors.textSecondary}
                  size={adjust(14, 2)}
                />
              </View>
            )}
          </View>
        </View>
      </ListItem>
      {isGroup &&
        decompose &&
        groupedBalances.map((balance, index) => {
          const chainInfo = getChainInfo(balance.chainId);

          const handlePress = () => {
            if (managed) {
              handleVisibilityPress([balance], hiddenGroup[index]!);
            } else {
              onPress(balance);
            }
          };

          return (
            <ListItem key={balance.chainId} onPress={handlePress}>
              <View
                className={cn(
                  'flex flex-row items-center justify-between px-4 py-3',
                  { 'opacity-50': hiddenGroup[index]! },
                )}
              >
                <View className='flex flex-row items-center space-x-4'>
                  <View
                    className='items-center justify-center'
                    style={withSize(size)}
                  >
                    <ChainAvatar chainInfo={chainInfo} size={childSize} />
                  </View>
                  <View className='flex flex-col'>
                    <Text className='text-text-primary text-sm font-medium'>
                      {chainInfo.name}
                    </Text>
                    <Text
                      className='text-text-secondary flex items-center truncate text-xs font-normal'
                      numberOfLines={1}
                    >
                      <Text
                        className={cn('text-xs font-normal', {
                          'tracking-lighter': preferences.stealthMode,
                        })}
                      >
                        {preferences.stealthMode
                          ? '﹡﹡﹡﹡'
                          : formatCrypto(
                              balance.balance,
                              balance.tokenMetadata.decimals,
                            )}
                      </Text>
                      <Text className='ml-1 text-xs'>{` ${balance.tokenMetadata.symbol}`}</Text>
                    </Text>
                  </View>
                </View>
                <View className='flex flex-row items-center space-x-4'>
                  <View className='flex-shrink-0 flex-col items-end text-right'>
                    <Text
                      className={cn('text-text-primary text-sm font-medium', {
                        'tracking-tighter': preferences.stealthMode,
                      })}
                    >
                      {preferences.stealthMode
                        ? '﹡﹡﹡﹡'
                        : formatMoney(parseFloat(balance.balanceInUSD))}
                    </Text>
                    {preferences.profitLoss === 'daily' ? (
                      <TodaysReturnRow
                        balance={balance}
                        stealthMode={preferences.stealthMode}
                      />
                    ) : (
                      <TotalReturnRow
                        balance={balance}
                        groupedBalances={[balance]}
                        stealthMode={preferences.stealthMode}
                      />
                    )}
                  </View>
                  {managed && (
                    <View
                      className='bg-card-highlight items-center justify-center rounded-full'
                      style={withSize(adjust(22, 2))}
                    >
                      <FontAwesomeIcon
                        icon={hiddenGroup[index]! ? faEyeSlash : faEye}
                        color={colors.textSecondary}
                        size={adjust(14, 2)}
                      />
                    </View>
                  )}
                </View>
              </View>
            </ListItem>
          );
        })}
    </View>
  );
}

const TodaysReturnRow = styled(function (props: {
  balance: ICryptoBalance;
  stealthMode: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { balance, stealthMode, style } = props;

  const percentage = Math.abs(balance.balanceChange.percent1D) * 100;
  const displayValue = stealthMode
    ? `${formatPercentage(percentage)}`
    : `${formatMoney(
        Math.abs(balance.balanceChange.absolute1D),
      )} (${formatPercentage(percentage)})`;

  return (
    <View style={style}>
      <Text
        className={cn('text-xs font-normal', {
          'text-success': balance.balanceChange.percent1D >= 0,
          'text-failure': balance.balanceChange.percent1D < 0,
        })}
      >
        {`${balance.balanceChange.percent1D >= 0 ? '+' : '-'}` + displayValue}
      </Text>
    </View>
  );
});

const TotalReturnRow = styled(function (props: {
  balance: ICryptoBalance;
  groupedBalances: ICryptoBalance[];
  stealthMode: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { balance, groupedBalances, stealthMode, style } = props;

  const [change, percent] = computeAggregatePNL(groupedBalances);
  const displayValue = stealthMode
    ? `${formatPercentage(Math.abs(percent) * 100)}`
    : `${formatMoney(Math.abs(change))} (${formatPercentage(
        Math.abs(percent) * 100,
      )})`;

  return (
    <View style={style}>
      <Text
        className={cn('text-xs font-normal', {
          'text-success': change >= 0,
          'text-failure': change < 0,
        })}
      >
        {`${change >= 0 ? '+' : '-'}` + displayValue}
      </Text>
    </View>
  );
});
