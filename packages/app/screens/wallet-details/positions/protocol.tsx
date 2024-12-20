import { faArrowUpRightFromSquare } from '@fortawesome/pro-regular-svg-icons';
import { faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { formatAddress } from '../../../common/format/address';
import { formatCrypto, formatMoney } from '../../../common/format/number';
import { Preferences } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { IconButton } from '../../../components/button/icon-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Image } from '../../../components/image';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { Protocol } from '../../../features/crypto/types';
import {
  ICryptoBalance,
  IPositionType,
} from '../../../graphql/client/generated/graphql';

function positionTypeToTitle(positionType: IPositionType) {
  switch (positionType) {
    case IPositionType.Deposit:
      return 'Deposited';
    case IPositionType.Loan:
      return 'Debt';
    case IPositionType.Locked:
      return 'Locked';
    case IPositionType.Staked:
      return 'Staked';
    case IPositionType.Margin:
      return 'Margin';
    case IPositionType.Reward:
      return 'Reward';
    default:
      return 'Asset';
  }
}

export function ProtocolListItem(props: {
  protocol: Protocol;
  preferences: Preferences;
  onPress: (balance: ICryptoBalance) => void;
}) {
  const { protocol, preferences, onPress } = props;

  const [validImage, setValidImage] = useState(true);

  return (
    <View className='bg-card flex w-full flex-col rounded-2xl py-3'>
      <View className='mb-2 flex flex-row items-center justify-between px-4'>
        <View className='flex flex-row items-center'>
          <View style={withSize(adjust(24, 2))}>
            {protocol.imageUrl && validImage ? (
              <Image
                source={protocol.imageUrl}
                style={{
                  ...withSize(adjust(24, 2)),
                  borderRadius: 9999,
                }}
                onError={() => setValidImage(false)}
              />
            ) : (
              <View
                className='bg-card-highlight items-center justify-center rounded-full'
                style={withSize(adjust(24, 2))}
              >
                <FontAwesomeIcon
                  icon={faBuildingColumns}
                  size={adjust(12, 2)}
                  color={colors.textSecondary}
                />
              </View>
            )}
          </View>
          <View className='pl-3'>
            <Text className='text-text-primary text-sm font-medium'>
              {protocol.name}
            </Text>
          </View>
          {!!protocol.link && (
            <View className='pl-1'>
              <IconButton
                icon={faArrowUpRightFromSquare}
                size={adjust(10, 2)}
                color={colors.textSecondary}
                onPress={() => Linking.openURL(protocol.link)}
              />
            </View>
          )}
        </View>
        {!preferences.stealthMode && (
          <Text className='text-text-primary text-sm font-medium'>
            {`${protocol.totalValueUSD < 0 ? '-' : ''}${formatMoney(
              Math.abs(protocol.totalValueUSD),
            )}`}
          </Text>
        )}
      </View>
      {protocol.groups.map((group) => (
        <View key={group.id}>
          <View className='flex flex-row items-center justify-between space-x-1 px-4 py-2'>
            <Text className='text-text-secondary text-xs font-normal'>
              {group.name}
            </Text>
            {!preferences.stealthMode && (
              <Text className='text-text-secondary text-xs font-normal'>
                {`${group.totalValueUSD < 0 ? '-' : ''}${formatMoney(
                  Math.abs(group.totalValueUSD),
                )}`}
              </Text>
            )}
          </View>
          {group.positions.map((position) => (
            <ListItem
              onPress={() => onPress(position)}
              key={`${position.address}:${position.chainId}:${
                position.positionInfo!.id
              }`}
            >
              <View className='flex flex-row items-center justify-between space-x-2 px-4 py-3'>
                <View className='flex flex-1 flex-row items-center space-x-4'>
                  <CryptoAvatar
                    url={position.tokenMetadata.imageUrl}
                    chainId={position.chainId}
                    size={adjust(36)}
                    symbol={position.tokenMetadata.symbol}
                  />
                  <View
                    className={cn('flex flex-1 flex-col pr-4', {
                      'space-y-0.5': Platform.OS !== 'web',
                    })}
                  >
                    <Text
                      className='text-text-primary truncate text-sm font-medium'
                      numberOfLines={1}
                    >
                      {position.tokenMetadata.name ||
                        formatAddress(position.address)}
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
                              position.balance,
                              position.tokenMetadata.decimals,
                            )}
                      </Text>
                      <Text className='ml-1 text-xs'>{` ${position.tokenMetadata.symbol}`}</Text>
                    </Text>
                  </View>
                </View>
                <View
                  className={cn('flex-shrink-0 flex-col items-end text-right', {
                    'space-y-0.5': Platform.OS !== 'web',
                  })}
                >
                  <Text
                    className={cn('text-text-primary text-sm font-medium', {
                      'tracking-tighter': preferences.stealthMode,
                    })}
                  >
                    {preferences.stealthMode
                      ? '﹡﹡﹡﹡'
                      : formatMoney(parseFloat(position.balanceInUSD))}
                  </Text>
                  <Text
                    className={cn('text-text-secondary text-xs font-normal', {
                      'tracking-tighter': preferences.stealthMode,
                    })}
                  >
                    {positionTypeToTitle(position.positionInfo!.type)}
                  </Text>
                </View>
              </View>
            </ListItem>
          ))}
        </View>
      ))}
    </View>
  );
}
