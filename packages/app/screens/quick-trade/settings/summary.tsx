import {
  faFireFlameSimple,
  faHandHoldingDollar,
  faPersonFalling,
  faShieldHalved,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { formatCrypto, formatPercentage } from '../../../common/format/number';
import { Loadable } from '../../../common/types';
import { opacity } from '../../../common/utils/functions';
import { loadableEq, onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Skeleton } from '../../../components/skeleton';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ChainId, getChainInfo } from '../../../features/chain';

export const SettingsSummary = memo(
  styled(function (props: {
    tip?: bigint;
    chainId: number;
    mev: boolean;
    slippage: number;
    totalGas: Loadable<bigint>;
    style?: StyleProp<ViewStyle>;
  }) {
    const { chainId, tip, slippage, totalGas, mev, style } = props;

    const chainInfo = getChainInfo(chainId);

    return (
      <View className='flex flex-row items-center space-x-3' style={style}>
        <View className='flex flex-row items-center space-x-1'>
          <FontAwesomeIcon
            icon={faPersonFalling}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <View
            className={cn('rounded-full px-2 py-0.5', {
              'bg-success/10': slippage <= 5,
              'bg-warning/10': slippage > 5 && slippage <= 25,
              'bg-failure/10': slippage > 25,
            })}
          >
            <Text
              className={cn('text-xs font-normal', {
                'text-success': slippage <= 5,
                'text-warning': slippage > 5 && slippage <= 25,
                'text-failure': slippage > 25,
              })}
            >
              {formatPercentage(slippage)}
            </Text>
          </View>
        </View>

        <View className='flex flex-row items-center space-x-1'>
          <FontAwesomeIcon
            icon={faFireFlameSimple}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          {onLoadable(totalGas)(
            () => (
              <Skeleton height={adjust(24, 2)} width={80} borderRadius={9999} />
            ),
            () => (
              <View
                className='rounded-full px-2 py-0.5'
                style={{
                  backgroundColor: opacity(chainInfo.color, 10),
                }}
              >
                <Text
                  className='text-xs font-normal'
                  style={{
                    color: chainInfo.color,
                  }}
                >
                  {'Variable'}
                </Text>
              </View>
            ),
            (totalGas) => (
              <View
                className='rounded-full px-2 py-0.5'
                style={{
                  backgroundColor: opacity(chainInfo.color, 10),
                }}
              >
                <Text
                  className='text-xs font-normal'
                  style={{
                    color: chainInfo.color,
                  }}
                >
                  {`${formatCrypto(
                    totalGas,
                    chainId === ChainId.Solana
                      ? 15
                      : chainInfo.nativeCurrency.decimals,
                  )} ${chainInfo.nativeCurrency.symbol}`}
                </Text>
              </View>
            ),
          )}
        </View>

        {chainId === ChainId.Solana && (
          <View className='flex flex-row items-center space-x-1'>
            <FontAwesomeIcon
              icon={faHandHoldingDollar}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
            <View
              className='rounded-full px-2 py-0.5'
              style={{
                backgroundColor: tip
                  ? opacity(chainInfo.color, 10)
                  : colors.cardHighlight,
              }}
            >
              <Text
                className='text-xs font-normal'
                style={{
                  color: tip ? chainInfo.color : colors.textSecondary,
                }}
              >
                {tip && tip >= 0n
                  ? `${formatCrypto(tip, chainInfo.nativeCurrency.decimals)} ${
                      chainInfo.nativeCurrency.symbol
                    }`
                  : 'None'}
              </Text>
            </View>
            {mev && !!tip && tip >= 0n && (
              <View className='bg-approve/10 rounded-full px-2 py-0.5'>
                <Text className='text-approve text-xs font-normal'>
                  {'MEV'}
                </Text>
              </View>
            )}
          </View>
        )}

        {chainId !== ChainId.Solana && (
          <View className='flex flex-row items-center space-x-1'>
            <FontAwesomeIcon
              icon={faShieldHalved}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
            <View
              className={cn('rounded-full px-2 py-0.5', {
                'bg-approve/10': mev,
                'bg-card-highlight': !mev,
              })}
            >
              <Text
                className={cn('text-xs font-normal', {
                  'text-approve': mev,
                  'text-text-secondary ': !mev,
                })}
              >
                {mev ? 'MEV' : 'None'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }),
  (prev, cur) =>
    prev.tip === cur.tip &&
    prev.chainId === cur.chainId &&
    prev.mev === cur.mev &&
    prev.slippage === cur.slippage &&
    loadableEq(prev.totalGas, cur.totalGas),
);
