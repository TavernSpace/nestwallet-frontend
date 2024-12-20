import { memo } from 'react';
import { View } from '../../components/view';
import {
  ICryptoBalance,
  IOrder,
  ITransaction,
  IUser,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { BalanceCard, OrdersCard, PositionCard } from './card';
import { TokenHistoryPanel, TokenQuickLinksPanel } from './panels';
import { ShareFunction } from './types';

export const DetailsSection = memo(
  function (props: {
    user: IUser;
    wallet: IWallet;
    token: ICryptoBalance;
    relevantTokens: ICryptoBalance[];
    orders: IOrder[];
    onTransactionPress: (transaction: ITransaction) => void;
    onSharePress: ReturnType<ShareFunction>;
  }) {
    const {
      user,
      wallet,
      token,
      relevantTokens,
      orders,
      onSharePress,
      onTransactionPress,
    } = props;

    return (
      <View className='flex flex-col'>
        <BalanceCard
          user={user}
          wallet={wallet}
          token={token}
          orders={orders}
          onSharePress={onSharePress}
        />
        <OrdersCard orders={orders} />
        <PositionCard relevantTokens={relevantTokens} />
        <TokenHistoryPanel
          wallet={wallet}
          token={token}
          onPressTransaction={onTransactionPress}
        />
        <TokenQuickLinksPanel token={token} />
      </View>
    );
  },
  (prev, cur) =>
    prev.orders === cur.orders &&
    prev.relevantTokens === cur.relevantTokens &&
    prev.token === cur.token,
);
