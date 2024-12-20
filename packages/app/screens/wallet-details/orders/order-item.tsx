import { faArrowsToDottedLine } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { formatCrypto, formatMoney } from '../../../common/format/number';
import { adjust, withSize } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { Alert } from '../../../components/alert';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import {
  ILimitOrder,
  ILimitOrderType,
  IOrder,
  IOrderStatus,
  IOrderType,
} from '../../../graphql/client/generated/graphql';

export function OrderListItem(props: {
  order: IOrder;
  onPress: VoidFunction;
  onCancel: (handler: VoidFunction) => Promise<void>;
}) {
  const { order, onPress, onCancel } = props;

  return order.type === IOrderType.LimitOrder ? (
    <LimitOrderItem
      order={order.limitOrder!}
      onPress={onPress}
      onCancel={onCancel}
    />
  ) : null;
}

function LimitOrderItem(props: {
  order: ILimitOrder;
  onPress: VoidFunction;
  onCancel: (handler: VoidFunction) => Promise<void>;
}) {
  const { order, onPress, onCancel } = props;

  const [showAlert, setShowAlert] = useState(false);

  const isBuy = order.orderType === ILimitOrderType.Buy;
  const primaryAsset = isBuy ? order.toToken : order.fromToken;
  const expired = order.expiresAt
    ? DateTime.fromISO(order.expiresAt) <= DateTime.now()
    : false;
  const isTerminal =
    order.status === IOrderStatus.Cancelled ||
    order.status === IOrderStatus.Complete ||
    order.status === IOrderStatus.Error;
  const cancelStatus =
    order.status === IOrderStatus.Active ||
    order.status === IOrderStatus.Inactive;

  const handleCancel = async () => {
    await onCancel(() => setShowAlert(false));
  };

  return (
    <>
      <BaseButton
        className='mx-4 overflow-hidden rounded-2xl'
        onPress={onPress}
      >
        <View className='bg-card flex flex-row items-center justify-between space-x-2 rounded-2xl px-4 py-3'>
          <View className='flex w-full flex-col space-y-3'>
            <View className='flex w-full flex-row items-center justify-between'>
              <View className='flex flex-row items-center space-x-2'>
                <View
                  className={cn('items-center justify-center rounded-full', {
                    'bg-success/10': isBuy,
                    'bg-failure/10': !isBuy,
                  })}
                  style={withSize(adjust(20, 2))}
                >
                  <FontAwesomeIcon
                    icon={faArrowsToDottedLine}
                    color={isBuy ? colors.success : colors.failure}
                    size={adjust(12, 2)}
                  />
                </View>
                <Text className='text-text-secondary text-sm font-medium'>
                  {isBuy ? 'Limit Buy' : 'Limit Sell'}
                </Text>
              </View>
              <View
                className={cn(
                  'flex flex-row items-center justify-center space-x-2 rounded-full px-2 py-0.5',
                  {
                    'bg-primary/10':
                      (order.status === IOrderStatus.Active ||
                        order.status === IOrderStatus.Uninitialized ||
                        order.status === IOrderStatus.PendingCancel ||
                        order.status === IOrderStatus.PendingComplete) &&
                      !expired,
                    'bg-success/10': order.status === IOrderStatus.Complete,
                    'bg-failure/10':
                      order.status === IOrderStatus.Cancelled ||
                      order.status === IOrderStatus.Inactive ||
                      order.status === IOrderStatus.Error ||
                      (expired && order.status !== IOrderStatus.Complete),
                  },
                )}
              >
                {order.status === IOrderStatus.Uninitialized && !expired && (
                  <ActivityIndicator
                    size={adjust(12, 2)}
                    color={colors.primary}
                  />
                )}
                <Text
                  className={cn('text-xs font-medium', {
                    'text-primary':
                      (order.status === IOrderStatus.Active ||
                        order.status === IOrderStatus.Uninitialized ||
                        order.status === IOrderStatus.PendingCancel ||
                        order.status === IOrderStatus.PendingComplete) &&
                      !expired,
                    'text-success': order.status === IOrderStatus.Complete,
                    'text-failure':
                      order.status === IOrderStatus.Cancelled ||
                      order.status === IOrderStatus.Inactive ||
                      order.status === IOrderStatus.Error ||
                      (expired && order.status !== IOrderStatus.Complete),
                  })}
                >
                  {expired && order.status !== IOrderStatus.Complete
                    ? 'Expired'
                    : order.status === IOrderStatus.Active
                    ? 'Active'
                    : order.status === IOrderStatus.PendingCancel
                    ? 'Cancelling'
                    : order.status === IOrderStatus.PendingComplete
                    ? 'Executing'
                    : order.status === IOrderStatus.Complete
                    ? 'Complete'
                    : order.status === IOrderStatus.Cancelled
                    ? 'Cancelled'
                    : order.status === IOrderStatus.Uninitialized
                    ? 'Placing order'
                    : order.status === IOrderStatus.Error
                    ? 'Error'
                    : 'Inactive'}
                </Text>
              </View>
            </View>
            <View className='flex flex-row items-center space-x-4'>
              <CryptoAvatar
                url={primaryAsset.imageUrl}
                chainId={order.chainId}
                chainBorderColor={colors.card}
                symbol={primaryAsset.symbol}
                size={adjust(36)}
              />
              <View className='flex flex-col'>
                <Text className='text-text-primary text-sm font-medium'>
                  {primaryAsset.name}
                </Text>
                <Text className='text-text-secondary text-xs font-normal'>
                  {isBuy
                    ? `${primaryAsset.symbol} @ ${formatMoney(
                        order.targetPrice,
                      )} with ${formatCrypto(
                        order.fromTokenAmount,
                        order.fromToken.decimals,
                      )} ${order.fromToken.symbol}`
                    : `${formatCrypto(
                        order.fromTokenAmount,
                        order.fromToken.decimals,
                      )} ${primaryAsset.symbol} @ ${formatMoney(
                        order.targetPrice,
                      )} to ${order.toToken.symbol}`}
                </Text>
              </View>
            </View>
            <View className='flex w-full flex-row items-center justify-between'>
              {order.completedAt ? (
                <Text className='text-text-secondary text-xs font-normal'>
                  {'Complete on ' +
                    DateTime.fromISO(order.completedAt).toLocaleString(
                      DateTime.DATETIME_MED,
                    )}
                </Text>
              ) : (
                <Text className='text-text-secondary text-xs font-normal'>
                  {order.status === IOrderStatus.Error
                    ? 'Failed to place order'
                    : order.expiresAt
                    ? (expired ? 'Expired at ' : 'Expires ') +
                      DateTime.fromISO(order.expiresAt).toLocaleString(
                        DateTime.DATETIME_MED,
                      )
                    : 'Good until cancelled'}
                </Text>
              )}
              {(cancelStatus || isTerminal || expired) && (
                <BaseButton onPress={() => setShowAlert(true)}>
                  <View className='bg-failure/10 rounded-lg px-2 py-1'>
                    <Text className='text-failure text-xs font-medium'>
                      {!expired && cancelStatus ? 'Cancel' : 'Dismiss'}
                    </Text>
                  </View>
                </BaseButton>
              )}
            </View>
          </View>
        </View>
      </BaseButton>
      <Alert
        title={!expired && cancelStatus ? 'Cancel Order' : 'Dismiss Order'}
        subtitle={
          'This action cannot be undone. If your order has not been executed yet, you will receive your funds back in your wallet.'
        }
        onCancel={() => setShowAlert(false)}
        onConfirm={handleCancel}
        isVisible={showAlert}
        cancelText={'Back'}
        confirmText={'Confirm'}
      />
    </>
  );
}
