import { faClone } from '@fortawesome/pro-regular-svg-icons';
import {
  faBadgeCheck,
  faBan,
  faHashtagLock,
  faUserMinus,
  faUserPlus,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../common/format/address';
import { formatEVMAddress } from '../../common/format/evm';
import { formatCrypto, formatMoney } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { adjust } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { NFTAvatar } from '../../components/avatar/nft-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { UINT256_MAX } from '../../features/evm/constants';
import {
  IBlockchainType,
  ITransactionNftApprovalEvent,
  ITransactionNftTransferEvent,
  ITransactionSafeAddedOwnerEvent,
  ITransactionSafeChangedThresholdEvent,
  ITransactionTokenApprovalEvent,
  ITransactionTokenTransferEvent,
} from '../../graphql/client/generated/graphql';

export const TokenApprovalItem = styled(function (props: {
  address: string;
  event: ITransactionTokenApprovalEvent;
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, onCopy, style } = props;

  const isRevoke = BigInt(event.quantity) === 0n;
  const amount =
    event.quantity === UINT256_MAX
      ? 'Unlimited'
      : formatCrypto(
          event.quantity,
          event.tokenMetadata.decimals,
          NumberType.TokenTx,
        );

  return (
    <View style={style}>
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-1 flex-row items-center space-x-4'>
          <FontAwesomeIcon
            icon={isRevoke ? faBan : faBadgeCheck}
            color={isRevoke ? colors.failure : colors.approve}
            size={adjust(24)}
          />
          <View
            className={cn('flex flex-col', {
              'flex-1': Platform.OS === 'web',
            })}
          >
            <Text
              className='text-text-primary truncate text-xs font-medium'
              numberOfLines={1}
            >
              {isRevoke ? 'Revoke' : `Approve: ${amount}`}
            </Text>
            <BaseButton
              onPress={onCopy ? () => onCopy(event.approved) : undefined}
            >
              <View className='flex flex-row items-center space-x-1'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {formatAddress(event.approved)}
                </Text>
                {onCopy && (
                  <FontAwesomeIcon
                    icon={faClone}
                    size={adjust(12, 2)}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </BaseButton>
          </View>
        </View>
        <View
          className={cn(
            'flex flex-1 flex-row items-center justify-end space-x-2',
            { 'pl-6': Platform.OS !== 'web' },
          )}
        >
          <CryptoAvatar
            url={event.tokenMetadata.imageUrl}
            size={adjust(24)}
            symbol={event.tokenMetadata.symbol}
          />
          <View className='flex flex-shrink flex-col'>
            <Text
              className='text-text-primary truncate text-xs font-medium'
              numberOfLines={1}
            >
              {event.tokenMetadata.name}
            </Text>
            <Text
              className='text-text-secondary truncate text-xs font-normal'
              numberOfLines={1}
            >
              {event.tokenMetadata.symbol}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const TokenTransferItem = styled(function (props: {
  address: string;
  event: ITransactionTokenTransferEvent;
  onCopy: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, address, onCopy, style } = props;

  const isReceiving = event.to === address;
  const value =
    parseFloat(
      ethers.formatUnits(event.quantity, event.tokenMetadata.decimals),
    ) * parseFloat(event.tokenMetadata.price);
  const isNative = event.tokenMetadata.isNativeToken;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4'>
        <CryptoAvatar
          url={event.tokenMetadata.imageUrl}
          size={adjust(24)}
          symbol={event.tokenMetadata.symbol}
        />
        <View className='flex-1 flex-grow'>
          <View className='flex flex-1 flex-row justify-between'>
            <Text className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'>
              {event.tokenMetadata.name}
            </Text>
            <Text
              className={cn('text-xs font-medium', {
                'text-success': isReceiving,
                'text-failure': !isReceiving,
              })}
            >
              {!isReceiving ? '-' : '+'}
              {formatCrypto(
                event.quantity,
                event.tokenMetadata.decimals,
                NumberType.TokenTx,
              )}
            </Text>
          </View>
          <View className='flex flex-1 flex-row justify-between'>
            <BaseButton
              className='flex-1 pr-1'
              onPress={() => onCopy(event.tokenMetadata.address)}
              disabled={isNative}
            >
              <View className='flex flex-row items-center space-x-1'>
                <Text
                  className='text-text-secondary overflow-hidden truncate text-xs font-normal'
                  numberOfLines={1}
                >
                  {event.tokenMetadata.symbol}
                </Text>
                {!isNative && (
                  <FontAwesomeIcon
                    icon={faClone}
                    size={adjust(10, 2)}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </BaseButton>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatMoney(value)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const NFTApprovalItem = styled(function (props: {
  address: string;
  blockchain: IBlockchainType;
  event: ITransactionNftApprovalEvent;
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, blockchain, onCopy, style } = props;

  const imageUrl = event.isForAll
    ? event.collectionMetadata.imageUrl
    : event.nftMetadata?.imagePreviewUrl;

  return (
    <View style={style}>
      <View className='flex flex-row items-center justify-between space-x-4'>
        <View className='flex flex-row items-center space-x-4'>
          <FontAwesomeIcon
            icon={faBadgeCheck}
            color={colors.approve}
            size={adjust(24)}
          />
          <View className='flex flex-col'>
            <Text className='text-text-primary text-xs font-medium'>
              Approve
            </Text>
            <BaseButton
              onPress={onCopy ? () => onCopy(event.approved) : undefined}
            >
              <View className='flex flex-row items-center space-x-1'>
                <Text className='text-text-secondary text-xs font-normal'>
                  {formatAddress(event.approved)}
                </Text>
                {onCopy && (
                  <FontAwesomeIcon
                    icon={faClone}
                    size={adjust(12, 2)}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </BaseButton>
          </View>
        </View>
        <View className='max-w-1/2 flex flex-row items-center space-x-2'>
          <NFTAvatar url={imageUrl} size={adjust(24)} />
          <View className='flex flex-1 flex-col justify-between'>
            <Text
              className='text-text-primary truncate text-xs font-medium'
              numberOfLines={1}
            >
              {event.collectionMetadata.name ||
                event.nftMetadata?.name ||
                'Unknown NFT'}
            </Text>
            <Text className='text-text-secondary truncate text-xs font-normal'>
              {event.tokenId ? `#${event.tokenId}` : 'All'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const NFTTransferItem = styled(function (props: {
  address: string;
  event: ITransactionNftTransferEvent;
  blockchain: IBlockchainType;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, address, blockchain, style } = props;

  const isReceiving = event.to === address;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4'>
        <NFTAvatar url={event.nftMetadata?.imagePreviewUrl} size={adjust(24)} />
        <View className='flex-1 flex-grow'>
          <View className='flex flex-1 flex-row justify-between'>
            <Text
              className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'
              numberOfLines={1}
            >
              {event.nftMetadata.name ||
                event.collectionMetadata.name ||
                'Unknown NFT'}
            </Text>
            <Text
              className={cn('text-xs font-medium', {
                'text-success': isReceiving,
                'text-failure': !isReceiving,
              })}
            >
              {!isReceiving ? '-' : '+'}
              {event.quantity}
            </Text>
          </View>
          <View className='flex flex-1 flex-row'>
            <Text className='text-text-secondary overflow-hidden truncate pr-1 text-xs font-normal'>
              {event.tokenId
                ? `#${event.tokenId}`
                : event.collectionMetadata.name}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const AddSafeOwnerItem = styled(function (props: {
  address: string;
  event: ITransactionSafeAddedOwnerEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4'>
        <FontAwesomeIcon
          icon={faUserPlus}
          size={adjust(24)}
          color={colors.success}
        />
        <View className='flex-1 flex-grow flex-col'>
          <View className='flex flex-1 flex-row items-center justify-between'>
            <Text className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'>
              Add Owner:
            </Text>
            <Text className='text-text-secondary text-xs font-medium'>
              {formatEVMAddress(event.owner)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const RemoveSafeOwnerItem = styled(function (props: {
  address: string;
  event: ITransactionSafeAddedOwnerEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4'>
        <FontAwesomeIcon
          icon={faUserMinus}
          size={adjust(24)}
          color={colors.failure}
        />
        <View className='flex-1 flex-grow flex-col'>
          <View className='flex flex-1 flex-row items-center justify-between'>
            <Text className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'>
              Remove Owner:
            </Text>
            <Text className='text-text-secondary text-xs font-medium'>
              {formatEVMAddress(event.owner)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export const SafeChangeThresholdItem = styled(function (props: {
  address: string;
  event: ITransactionSafeChangedThresholdEvent;
  style?: StyleProp<ViewStyle>;
}) {
  const { event, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4'>
        <FontAwesomeIcon
          icon={faHashtagLock}
          size={adjust(24)}
          color={colors.approve}
        />
        <View className='flex-1 flex-grow flex-col'>
          <View className='flex flex-1 flex-row items-center justify-between'>
            <Text className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'>
              Change Threshold:
            </Text>
            <Text className='text-text-primary text-xs font-medium'>
              {event.threshold}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});
