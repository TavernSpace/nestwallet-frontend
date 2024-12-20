import { faClock, faFireAlt } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { formatCrypto, formatMoney } from '../../../common/format/number';
import { opacity } from '../../../common/utils/functions';
import { adjust, withSize } from '../../../common/utils/style';
import { InfoAlert } from '../../../components/alert/info';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ChainId, getChainInfo } from '../../../features/chain';
import { ICryptoBalance } from '../../../graphql/client/generated/graphql';

export interface LimitSectionProps {
  expiration?: number;
  nativeAsset?: ICryptoBalance;
  onDateChange: (date?: DateTime) => void;
}

export function LimitSection(props: LimitSectionProps) {
  const { expiration, nativeAsset, onDateChange } = props;

  const [showAlert, setShowAlert] = useState(false);

  const orderFee = 7_000_000n;
  const sufficientFee = !!nativeAsset && BigInt(nativeAsset.balance) > orderFee;

  return (
    <View className='mt-3 flex flex-col space-y-2 px-4'>
      <Text className='text-text-primary text-sm font-medium'>
        {'Order Options'}
      </Text>
      <View className='bg-card flex flex-col space-y-3 rounded-2xl px-4 py-3'>
        <View className='flex flex-row items-center justify-between space-x-2'>
          <View className='flex flex-row items-center space-x-2'>
            <View
              className='items-center justify-center rounded-full'
              style={{
                ...withSize(adjust(16, 2)),
                backgroundColor: opacity(colors.questTime, 10),
              }}
            >
              <FontAwesomeIcon
                icon={faClock}
                size={adjust(10, 2)}
                color={colors.questTime}
              />
            </View>
            <Text className='text-text-secondary text-xs font-medium'>
              {'Expiration'}
            </Text>
          </View>
          <View className='bg-card-highlight rounded-full px-2 py-1'>
            <Text className='text-text-secondary text-xs font-normal'>
              {expiration
                ? DateTime.fromSeconds(expiration).toLocaleString(
                    DateTime.DATETIME_MED,
                  )
                : 'Never'}
            </Text>
          </View>
        </View>
        <View className='flex flex-col space-y-2'>
          <View className='flex flex-row items-center space-x-2'>
            <BaseButton
              className='flex-1'
              onPress={() => onDateChange(DateTime.now().plus({ days: 1 }))}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'1 Day'}
                </Text>
              </View>
            </BaseButton>
            <BaseButton
              className='flex-1'
              onPress={() => onDateChange(DateTime.now().plus({ days: 7 }))}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'1 Week'}
                </Text>
              </View>
            </BaseButton>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <BaseButton
              className='flex-1'
              onPress={() => onDateChange(DateTime.now().plus({ days: 30 }))}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'1 Month'}
                </Text>
              </View>
            </BaseButton>
            <BaseButton
              className='flex-1'
              onPress={() => onDateChange(undefined)}
            >
              <View className='bg-card-highlight items-center justify-center rounded-xl py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {'Never'}
                </Text>
              </View>
            </BaseButton>
          </View>
        </View>
      </View>
      <BaseButton onPress={() => setShowAlert(true)}>
        <View className='bg-card flex flex-row items-center justify-between rounded-xl px-4 py-3'>
          <View className='flex flex-row items-center space-x-2'>
            <View
              className='bg-failure/10 items-center justify-center rounded-full'
              style={withSize(adjust(16, 2))}
            >
              <FontAwesomeIcon
                icon={faFireAlt}
                size={adjust(10, 2)}
                color={colors.failure}
              />
            </View>
            <Text className='text-text-secondary text-xs font-medium'>
              {'Order Fee'}
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-1'>
            <View
              className={cn('rounded-full px-2 py-1', {
                'bg-card-highlight': sufficientFee,
                'bg-failure/10': !sufficientFee,
              })}
            >
              <Text
                className={cn('text-xs font-normal', {
                  'text-text-secondary': sufficientFee,
                  'text-failure': !sufficientFee,
                })}
              >
                {nativeAsset && sufficientFee
                  ? formatMoney(
                      parseFloat(nativeAsset.tokenMetadata.price) *
                        parseFloat(ethers.formatUnits(orderFee, 9)),
                    )
                  : 'Insufficient SOL'}
              </Text>
            </View>
            {sufficientFee && (
              <View
                className='rounded-full px-2 py-1'
                style={{
                  backgroundColor: opacity(
                    getChainInfo(ChainId.Solana).color,
                    10,
                  ),
                }}
              >
                <Text
                  className='text-xs font-normal'
                  style={{
                    color: getChainInfo(ChainId.Solana).color,
                  }}
                >
                  {`${formatCrypto(orderFee, 9)} SOL`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </BaseButton>
      <InfoAlert
        title={'Order Fee'}
        body={
          'The fee which will be used to execute your limit order on chain.'
        }
        isVisible={showAlert}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}
