import { faClone } from '@fortawesome/pro-regular-svg-icons';
import { faBadgeCheck, faBan } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { formatAddress } from '../../common/format/address';
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
  IMessageNftApprovalEvent,
  IMessageNftTransferEvent,
  IMessageTokenApprovalEvent,
  IMessageTokenTransferEvent,
  ITransferType,
  IWallet,
} from '../../graphql/client/generated/graphql';

export const TokenApprovalItem = (props: {
  wallet: IWallet;
  event: IMessageTokenApprovalEvent;
  onCopy?: (text: string) => void;
}) => {
  const { wallet, event, onCopy } = props;

  const isRevoke = BigInt(event.quantity) === 0n;
  const amount =
    event.quantity === UINT256_MAX
      ? 'Unlimited'
      : formatCrypto(
          event.quantity,
          event.tokenMetadata.decimals,
          NumberType.TokenTx,
        );
  const size = adjust(24);

  return (
    <View className='flex flex-row items-center justify-between'>
      <View className='flex flex-1 flex-row items-center space-x-4'>
        <FontAwesomeIcon
          icon={isRevoke ? faBan : faBadgeCheck}
          color={isRevoke ? colors.failure : colors.approve}
          size={size}
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
              <Text className='text-text-secondary text-xs font-medium'>
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
          symbol={event.tokenMetadata.symbol}
          size={size}
        />
        <View className='flex flex-shrink flex-col'>
          <Text
            className='text-text-primary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {event.tokenMetadata.name}
          </Text>
          <Text
            className='text-text-secondary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {event.tokenMetadata.symbol}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const TokenTransferItem = (props: {
  wallet: IWallet;
  event: IMessageTokenTransferEvent;
}) => {
  const { event } = props;

  const isReceiving = event.type === ITransferType.Receive;
  const value =
    parseFloat(
      ethers.formatUnits(event.quantity, event.tokenMetadata.decimals),
    ) * parseFloat(event.tokenMetadata.price);
  const size = adjust(24);

  return (
    <View className='flex flex-row items-center space-x-4'>
      <CryptoAvatar
        url={event.tokenMetadata.imageUrl}
        symbol={event.tokenMetadata.symbol}
        size={size}
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
          <Text
            className='text-text-secondary overflow-hidden truncate pr-1 text-xs font-medium'
            numberOfLines={1}
          >
            {event.tokenMetadata.symbol}
          </Text>
          <Text className='text-text-secondary text-xs font-medium'>
            {formatMoney(value)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const NFTApprovalItem = (props: {
  wallet: IWallet;
  event: IMessageNftApprovalEvent;
}) => {
  const { event } = props;

  const imageUrl = event.collectionMetadata.imageUrl;
  const size = adjust(24);

  return (
    <View className='flex flex-row items-center justify-between space-x-4'>
      <View className='flex flex-row items-center space-x-4'>
        <FontAwesomeIcon
          icon={faBadgeCheck}
          color={colors.approve}
          size={size}
        />
        <View className='flex flex-col'>
          <Text className='text-text-primary text-xs font-medium'>Approve</Text>
        </View>
      </View>
      <View className='max-w-1/2 flex flex-row items-center space-x-2'>
        <NFTAvatar url={imageUrl} size={size} />
        <View className='flex flex-1 flex-col justify-between'>
          <Text
            className='text-text-primary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {event.collectionMetadata.name}
          </Text>
          <Text className='text-text-secondary truncate text-xs font-medium'>
            All
          </Text>
        </View>
      </View>
    </View>
  );
};

export const NFTTransferItem = (props: {
  wallet: IWallet;
  event: IMessageNftTransferEvent;
}) => {
  const { event } = props;

  const isReceiving = event.type === ITransferType.Receive;
  const size = adjust(24);

  return (
    <View className='flex flex-row items-center space-x-4'>
      <NFTAvatar url={event.nftMetadata.imagePreviewUrl} size={size} />
      <View className='flex-1 flex-grow'>
        <View className='flex flex-1 flex-row justify-between'>
          <Text
            className='text-text-primary overflow-hidden truncate pr-1 text-xs font-medium'
            numberOfLines={1}
          >
            {event.collectionMetadata.name}
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
          <Text className='text-text-secondary overflow-hidden truncate pr-1 text-xs font-medium'>
            {`#${event.tokenId}`}
          </Text>
        </View>
      </View>
    </View>
  );
};
