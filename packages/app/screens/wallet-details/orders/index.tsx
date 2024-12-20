import {
  IBlockchainType,
  IOrder,
  IOrderFilter,
  IOrderInputType,
  IWallet,
  useCancelLimitOrderMutation,
  useOrdersQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useEffect } from 'react';
import { minTime } from '../../../common/api/utils';
import { loadDataFromQuery } from '../../../common/utils/query';
import { View } from '../../../components/view';
import { parseError } from '../../../features/errors';
import { refreshHapticAsync } from '../../../features/haptic';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { OrdersWithData } from './data';

export function WalletOrders(props: {
  wallet: IWallet;
  filteredChain: number;
  refreshing: boolean;
  onStartRefresh: VoidFunction;
  onEndRefresh: VoidFunction;
  onOrderPress: (order: IOrder) => void;
}) {
  const { wallet, refreshing, onStartRefresh, onEndRefresh, onOrderPress } =
    props;
  const { showSnackbar } = useSnackbar();

  const cancelLimitOrderMutation = useCancelLimitOrderMutation();

  const ordersQuery = useOrdersQuery(
    {
      input: {
        walletId: wallet.id,
        type: IOrderInputType.All,
        filter: IOrderFilter.Pending,
      },
    },
    {
      enabled: wallet.blockchain === IBlockchainType.Svm,
      staleTime: 30 * 1000,
    },
  );
  const orders = loadDataFromQuery(ordersQuery, (data) =>
    data.orders.edges.map((edge) => edge.node as IOrder),
  );

  const handleCancelOrder = async (order: IOrder) => {
    if (order.limitOrder) {
      await cancelLimitOrderMutation.mutateAsync({
        id: order.limitOrder.id,
      });
      await ordersQuery.refetch();
    }
  };

  const handleRefresh = async () => {
    try {
      onStartRefresh();
      await minTime(ordersQuery.refetch(), 500);
      refreshHapticAsync();
    } catch (err) {
      const error = parseError(err, 'Failed to refresh orders');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      onEndRefresh();
    }
  };

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing]);

  return (
    <View className='flex-1'>
      <OrdersWithData
        wallet={wallet}
        orders={orders}
        onOrderPress={onOrderPress}
        onCancelOrder={handleCancelOrder}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}
