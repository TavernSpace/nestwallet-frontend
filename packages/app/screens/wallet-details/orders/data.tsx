import { faCube } from '@fortawesome/pro-solid-svg-icons';
import { RefreshControl } from 'react-native';
import { Loadable, VoidPromiseFunction } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import {
  CardEmptyState,
  CardErrorState,
} from '../../../components/card/card-empty-state';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { AssetListItemSkeleton } from '../../../components/skeleton/list-item';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { IOrder, IWallet } from '../../../graphql/client/generated/graphql';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { walletDetailBottomTabOffset } from '../navigation/tab-bar-floating';
import { OrderListItem } from './order-item';

interface OrdersWithDataProps {
  wallet: IWallet;
  orders: Loadable<IOrder[]>;
  refreshing: boolean;
  onRefresh: VoidPromiseFunction;
  onOrderPress: (order: IOrder) => void;
  onCancelOrder: (token: IOrder) => Promise<void>;
}

export function OrdersWithData(props: OrdersWithDataProps) {
  const { wallet, orders, refreshing, onRefresh, onOrderPress, onCancelOrder } =
    props;
  const { showSnackbar } = useSnackbar();
  const inset = useSafeAreaInsets();

  const handleCancelOrder = async (order: IOrder, handler: VoidFunction) => {
    try {
      await onCancelOrder(order);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Successfully removed limit order!',
      });
      handler();
    } catch (err) {
      const error = parseError(
        err,
        'Unable to remove limit order, please try again.',
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const renderItem = ({ item }: RenderItemProps<IOrder>) => {
    return (
      <OrderListItem
        order={item}
        onPress={() => onOrderPress(item)}
        onCancel={(handler) => handleCancelOrder(item, handler)}
      />
    );
  };

  return onLoadable(orders)(
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton />
        <AssetListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton fixed />
        <AssetListItemSkeleton fixed />
        <View className='-mt-16 items-center justify-center'>
          <CardErrorState
            title={`Unable to get Orders`}
            description={`Something went wrong trying to get your orders.`}
          />
        </View>
      </View>
    ),
    (orders) =>
      orders.length === 0 ? (
        <View className='flex flex-col'>
          <AssetListItemSkeleton fixed />
          <AssetListItemSkeleton fixed />
          <View className='-mt-16 items-center justify-center'>
            <CardEmptyState
              overrideIcon={
                <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
                  <FontAwesomeIcon
                    icon={faCube}
                    size={48}
                    color={colors.primary}
                  />
                </View>
              }
              title={`No Orders`}
              description={`You do not have any open orders.`}
            />
          </View>
        </View>
      ) : (
        <View className='flex flex-1 flex-col'>
          <FlatList
            data={orders}
            estimatedItemSize={adjust(60)}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.limitOrder?.id}`}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                progressBackgroundColor={colors.cardHighlight}
                tintColor={colors.primary}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            ItemSeparatorComponent={() => <View className='h-3' />}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: inset.bottom + walletDetailBottomTabOffset,
            }}
          />
        </View>
      ),
  );
}
