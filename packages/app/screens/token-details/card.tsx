import {
  faArrowDownToLine,
  faArrowUpToLine,
  faPaperPlane,
  faShare,
  faShuffle,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import { chain, uniq } from 'lodash';
import { memo, useState } from 'react';
import {
  formatCrypto,
  formatMoney,
  formatPercentage,
} from '../../common/format/number';
import { formatDate } from '../../common/format/time';
import { NumberType } from '../../common/format/types';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { LayeredChainAvatar } from '../../components/avatar/chain-avatar/layered';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { Button } from '../../components/button/button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { ListItem } from '../../components/list/list-item';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { computeAggregatePNL, isDebt } from '../../features/crypto/balance';
import {
  ICryptoBalance,
  ILimitOrder,
  ILimitOrderType,
  IOrder,
  ITransaction,
  IUser,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ShareSheet } from './share-sheet';
import { ShareFunction } from './types';

export function TokenDetailCard(props: {
  title: string;
  subtitle: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  subtitleColor?: string;
}) {
  const { title, subtitle, startAdornment, endAdornment, subtitleColor } =
    props;
  return (
    <View className='bg-card-highlight mr-2 mt-2 flex flex-col space-y-1 rounded-xl px-3 py-2'>
      <View className='flex flex-row items-center space-x-1'>
        {startAdornment}
        <Text className='text-text-secondary text-sm font-normal'>{title}</Text>
        {endAdornment}
      </View>
      <Text
        className='text-sm font-normal'
        style={{
          color: subtitleColor || colors.textPrimary,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

export function TokenHistoryCard(props: {
  wallet: IWallet;
  token: ICryptoBalance;
  transaction: ITransaction;
  onPress: (transaction: ITransaction) => void;
}) {
  const { wallet, token, transaction, onPress } = props;

  const transactionEvents = transaction.transactionEvents;
  const tokenTransfers = transactionEvents.tokenTransfers;
  const mainToken = tokenTransfers.find(
    (event) => event.tokenMetadata.address === token.tokenMetadata.address,
  );
  const secondaryToken = tokenTransfers.find(
    (event) => event.tokenMetadata.address !== token.tokenMetadata.address,
  );
  const isReceiving = mainToken?.to === wallet.address;
  const isSending = !isReceiving;
  const isSwap =
    (isReceiving &&
      tokenTransfers.length > 1 &&
      tokenTransfers.find((transfer) => transfer.from === wallet.address)) ||
    (isSending &&
      tokenTransfers.length > 1 &&
      tokenTransfers.find((transfer) => transfer.to === wallet.address));

  return (
    <ListItem onPress={() => onPress(transaction)}>
      <View className='flex flex-row items-center space-x-4 rounded-lg px-4 py-3'>
        <View className='flex flex-1 flex-col'>
          <View className='flex w-full flex-row items-center space-x-1.5'>
            <View
              className={cn('items-center justify-center rounded-full', {
                'bg-receive/20': isReceiving && !isSwap,
                'bg-send/20': isSending && !isSwap,
                'bg-swap-light/20': isSwap,
              })}
              style={withSize(adjust(14, 2))}
            >
              <FontAwesomeIcon
                icon={
                  isSwap
                    ? faShuffle
                    : isReceiving
                    ? faArrowDownToLine
                    : faPaperPlane
                }
                size={adjust(isSending ? 8 : 10, 2)}
                color={
                  isSwap
                    ? colors.swapLight
                    : isReceiving
                    ? colors.receive
                    : colors.send
                }
              />
            </View>
            <Text
              className='text-text-primary truncate text-sm font-normal'
              numberOfLines={1}
            >
              {isSwap
                ? `Swap ${
                    mainToken?.from === wallet.address
                      ? mainToken.tokenMetadata.symbol
                      : secondaryToken?.tokenMetadata.symbol
                  } for ${
                    mainToken?.to === wallet.address
                      ? mainToken.tokenMetadata.symbol
                      : secondaryToken?.tokenMetadata.symbol
                  }`
                : `${isSending ? 'Send' : 'Receive'} ${
                    tokenTransfers[0]!.tokenMetadata.symbol
                  }`}
            </Text>
          </View>
          <Text
            className='text-text-secondary truncate text-xs font-normal'
            numberOfLines={1}
          >
            {formatDate(transaction.minedAt)}
          </Text>
        </View>

        {mainToken && (
          <View className='flex flex-row justify-end'>
            <View className='flex flex-col items-end'>
              <Text
                className={cn('truncate text-end text-sm font-normal', {
                  'text-success': isReceiving,
                  'text-failure': !isReceiving,
                })}
                numberOfLines={1}
              >
                {`${isReceiving ? '+' : '-'}${formatCrypto(
                  mainToken.quantity,
                  mainToken.tokenMetadata.decimals,
                )} ${mainToken.tokenMetadata.symbol}`}
              </Text>
              <Text
                className='text-text-secondary truncate text-end text-xs font-normal'
                numberOfLines={1}
              >
                {formatMoney(
                  parseFloat(
                    ethers.formatUnits(
                      mainToken.quantity,
                      mainToken.tokenMetadata.decimals,
                    ),
                  ) * parseFloat(mainToken.tokenMetadata.price),
                )}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ListItem>
  );
}

// TODO: make this live
export const BalanceCard = memo(
  function (props: {
    user: IUser;
    wallet: IWallet;
    token: ICryptoBalance;
    orders: IOrder[];
    onSharePress: ReturnType<ShareFunction>;
  }) {
    const { user, token, onSharePress } = props;

    const [showShareSheet, setShowShareSheet] = useState(false);

    const [pnlAbsolute, pnlPercentage, costBasis] = computeAggregatePNL([
      token,
    ]);

    return (
      <View className='px-4'>
        <View className='bg-card flex w-full flex-col space-y-2 rounded-2xl px-4 py-3'>
          <Text className='text-text-primary text-base font-medium'>
            Balances
          </Text>
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <Text className='text-text-secondary text-sm font-normal'>
                {'Wallet Balance'}
              </Text>
            </View>
            <View className='flex flex-row items-center space-x-2'>
              <View className='bg-card-highlight rounded-full px-2 py-0.5'>
                <Text className='text-text-secondary text-sm font-normal'>
                  {formatMoney(parseFloat(token.balanceInUSD))}
                </Text>
              </View>
              <Text className='text-text-primary text-sm font-normal'>
                {`${formatCrypto(
                  token.balance,
                  token.tokenMetadata.decimals,
                )} ${token.tokenMetadata.symbol}`}
              </Text>
            </View>
          </View>
          <View className='flex flex-row items-center justify-between'>
            <Text className='text-text-secondary text-sm font-normal'>
              {'Profit & Loss'}
            </Text>
            <Text
              className={cn('text-sm font-normal', {
                'text-success': pnlAbsolute >= 0,
                'text-failure': pnlAbsolute < 0,
              })}
            >
              {`${pnlAbsolute >= 0 ? '+' : '-'}${formatMoney(
                Math.abs(pnlAbsolute),
              )} (${formatPercentage(Math.abs(pnlPercentage * 100))})`}
            </Text>
          </View>
          {token.balance !== '0' && (
            <View className='flex w-full flex-row items-center justify-center pt-1'>
              <Button
                className='w-full'
                type='primary'
                onPress={() => setShowShareSheet(true)}
                buttonColor={opacity(colors.pnl, 20)}
              >
                <View className='flex w-full flex-row items-center justify-center space-x-2'>
                  <FontAwesomeIcon
                    icon={faShare}
                    size={adjust(14, 2)}
                    color={colors.pnl}
                  />
                  <Text
                    className='text-center text-sm font-medium'
                    style={{ color: colors.pnl }}
                  >
                    Share
                  </Text>
                </View>
              </Button>
            </View>
          )}
        </View>
        <ShareSheet
          isShowing={showShareSheet}
          user={user}
          token={token}
          costBasis={costBasis}
          profitAbsolute={pnlAbsolute}
          profitPercentage={pnlPercentage}
          onPressShare={onSharePress}
          onClose={() => setShowShareSheet(false)}
        />
      </View>
    );
  },
  (prev, cur) =>
    prev.token === cur.token &&
    prev.wallet === cur.wallet &&
    prev.user === cur.user,
);

export const PositionCard = memo(function (props: {
  relevantTokens: ICryptoBalance[];
}) {
  const { relevantTokens } = props;

  const aggregateProtocolValues = chain(relevantTokens)
    .groupBy((token) => token.positionInfo?.protocolId ?? 'Wallet')
    .toArray()
    .value()
    .map((protocol) => ({
      name: protocol[0]!.positionInfo?.protocol ?? 'Wallet',
      image: protocol[0]!.positionInfo?.protocolImageUrl ?? undefined,
      value: protocol.reduce(
        (acc, cur) =>
          isDebt(cur)
            ? acc - parseFloat(cur.balanceInUSD)
            : acc + parseFloat(cur.balanceInUSD),
        0,
      ),
      chains: uniq(protocol.map((proto) => proto.chainId)),
    }));
  const validProtocols = aggregateProtocolValues.filter(
    (position) => position.name !== 'Wallet',
  );

  return validProtocols.length > 0 ? (
    <View className='mt-2 px-4'>
      <View className='bg-card flex flex-col space-y-1 rounded-2xl px-4 py-3'>
        <Text className='text-text-primary text-base font-medium'>
          Position Details
        </Text>
        <View className='flex flex-row flex-wrap'>
          {validProtocols.map((protocol, index) => (
            <TokenDetailCard
              key={index}
              title={protocol.name}
              startAdornment={
                protocol.image ? (
                  <Image
                    source={{ uri: protocol.image }}
                    style={{
                      ...withSize(adjust(14)),
                      borderRadius: 9999,
                    }}
                  />
                ) : undefined
              }
              endAdornment={
                protocol.chains.length > 1 ? (
                  <LayeredChainAvatar
                    chains={protocol.chains}
                    size={adjust(12)}
                    border={true}
                    borderColor={colors.cardHighlight}
                  />
                ) : undefined
              }
              subtitle={
                protocol.value >= 0
                  ? formatMoney(protocol.value)
                  : `-${formatMoney(Math.abs(protocol.value))}`
              }
            />
          ))}
        </View>
      </View>
    </View>
  ) : null;
});

export const OrdersCard = memo(function (props: { orders: IOrder[] }) {
  const { orders } = props;

  return orders.length > 0 ? (
    <View className='mt-2 space-y-3 px-4'>
      <View className='bg-card flex flex-col rounded-2xl px-4 py-1'>
        <View className='pb-1 pt-2'>
          <Text className='text-text-primary text-base font-medium'>
            Active Orders
          </Text>
        </View>
        {orders.map((item) =>
          item.limitOrder ? (
            <LimitOrderItem key={item.limitOrder.id} order={item.limitOrder} />
          ) : null,
        )}
      </View>
    </View>
  ) : null;
});

function LimitOrderItem(props: { order: ILimitOrder }) {
  const { order } = props;

  return (
    <View className='flex flex-row items-center justify-between py-3'>
      <View className='flex flex-row items-center space-x-3'>
        <CryptoAvatar
          url={order.fromToken.imageUrl}
          symbol={order.fromToken.symbol}
          size={adjust(36)}
        />
        <View className='flex flex-col'>
          <View className='flex flex-row items-center space-x-1'>
            <View
              className={cn('items-center justify-center rounded-full', {
                'bg-success/10': order.orderType === ILimitOrderType.Buy,
                'bg-failure/10': order.orderType !== ILimitOrderType.Buy,
              })}
              style={withSize(adjust(14, 2))}
            >
              <FontAwesomeIcon
                icon={
                  order.orderType === ILimitOrderType.Buy
                    ? faArrowUpToLine
                    : faArrowDownToLine
                }
                color={
                  order.orderType === ILimitOrderType.Buy
                    ? colors.success
                    : colors.failure
                }
                size={adjust(10, 2)}
              />
            </View>
            <Text className='text-text-primary text-sm font-normal'>
              {order.orderType === ILimitOrderType.Buy ? 'Buy' : 'Sell'}
            </Text>
          </View>
          <Text className='text-text-secondary text-xs font-normal'>
            {`${formatCrypto(
              order.fromTokenAmount,
              order.fromToken.decimals,
            )} ${order.fromToken.symbol}`}
          </Text>
        </View>
      </View>
      <View className='flex flex-col items-end'>
        <Text className='text-text-primary text-xs font-normal'>
          {`${formatMoney(
            order.targetPrice,
            NumberType.FiatTokenExactPrice,
          )} / ${order.fromToken.symbol}`}
        </Text>
        <Text className='text-text-secondary text-xs font-normal'>
          {`for ${formatMoney(
            order.targetPrice *
              parseFloat(
                ethers.formatUnits(
                  order.fromTokenAmount,
                  order.fromToken.decimals,
                ),
              ),
          )}`}
        </Text>
      </View>
    </View>
  );
}
