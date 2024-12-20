import _ from 'lodash';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import EmptyHistory from '../../../../assets/images/empty-history.svg';
import EmptyMessages from '../../../../assets/images/empty-messages.svg';
import EmptyTransactions from '../../../../assets/images/empty-transactions.svg';
import { minTime } from '../../../../common/api/utils';
import { Loadable, VoidPromiseFunction } from '../../../../common/types';
import { tuple } from '../../../../common/utils/functions';
import {
  composeLoadables,
  onLoadable,
  spreadLoadable,
} from '../../../../common/utils/query';
import { adjust } from '../../../../common/utils/style';
import {
  CardEmptyState,
  CardErrorState,
} from '../../../../components/card/card-empty-state';
import { SectionList } from '../../../../components/flashlist/section-list';
import { HistoryListItemSkeleton } from '../../../../components/skeleton/list-item';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { refreshHapticAsync } from '../../../../features/haptic';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import {
  IHistory,
  IHistoryType,
  IMessageProposal,
  ITransaction,
  ITransactionProposal,
  ITransactionProposalType,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import {
  PendingTransactionListItem,
  SignedMessageListItem,
  TransactionListItem,
} from '../../../../molecules/transaction/list';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { walletDetailBottomTabOffset } from '../../navigation/tab-bar-floating';
import { HistoryType } from '../types';

type SectionListItem = ITransactionProposal | IHistory;

interface SectionListSection {
  title: string;
  data: SectionListItem[];
}

enum TimePartition {
  Today = 4,
  Yesterday = 3,
  ThisWeek = 2,
  ThisMonth = 1,
}

function isHistory(
  item: ITransactionProposal | IHistory,
): item is ITransactionProposal {
  const val = item as any;
  const isProposal =
    val.type === ITransactionProposalType.Safe ||
    val.type === ITransactionProposalType.EthKey ||
    val.type === ITransactionProposalType.SvmKey ||
    val.type === ITransactionProposalType.TvmKey;
  return !isProposal;
}

function isPendingTransaction(
  item: ITransactionProposal | IHistory,
): item is ITransactionProposal {
  return !isHistory(item);
}

function timeRepresentation(time: TimePartition) {
  // use time which is greater than all possible tx
  const year2100 = 4102459200;
  return year2100 + time;
}

function revertTimeRepresentation(time: number) {
  // use time which is greater than all possible tx
  const year2100 = 4102459200;
  return time - year2100;
}

interface HistoryScreenProps {
  wallet: IWallet;
  filter: HistoryType;
  syncing: boolean;
  history: Loadable<IHistory[]>;
  pendingTransactions: Loadable<ITransactionProposal[]>;
  onPressTransaction: (transaction: ITransaction) => void;
  onPressPendingTransaction: (transaction: ITransactionProposal) => void;
  onPressMessage: (message: IMessageProposal) => void;
  onLoadMore: VoidFunction;
  onRefresh: VoidPromiseFunction;
}

export function HistoryScreen(props: HistoryScreenProps) {
  const {
    wallet,
    filter,
    syncing,
    history,
    pendingTransactions,
    onPressTransaction,
    onPressMessage,
    onPressPendingTransaction,
    onLoadMore,
    onRefresh,
  } = props;
  const { showSnackbar } = useSnackbar();
  const inset = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

  // TODO: should merge pending/history items with the same hash and chain so there is smooth transition between them when state changes
  // TODO: this should also be done in a composeLoadable for correctness and the onLoadable should take timeGroups as arg
  const timeGroups: SectionListSection[] = useMemo(() => {
    const currentTime = DateTime.now();
    const historyGroups = _.chain(
      history.data?.filter(
        (item) =>
          filter === 'all' ||
          (filter === 'tx' && item.type === IHistoryType.Transaction) ||
          (filter === 'msg' && item.type === IHistoryType.Message),
      ),
    )
      .groupBy((item) => {
        const time = DateTime.fromISO(item.timestamp);
        // group tx by today, yesterday, this week, this month, and by month afterwards
        if (currentTime.hasSame(time, 'day')) {
          return timeRepresentation(TimePartition.Today);
        } else if (currentTime.minus({ days: 1 }).hasSame(time, 'day')) {
          return timeRepresentation(TimePartition.Yesterday);
        } else if (currentTime.hasSame(time, 'week')) {
          return timeRepresentation(TimePartition.ThisWeek);
        } else if (currentTime.hasSame(time, 'month')) {
          return timeRepresentation(TimePartition.ThisMonth);
        } else {
          return DateTime.local(time.year, time.month).toUnixInteger();
        }
      })
      .toPairs()
      .value()
      .sort((group, otherGroup) => parseInt(otherGroup[0]) - parseInt(group[0]))
      .map((group) => {
        const time = parseInt(group[0]);
        const date = DateTime.fromSeconds(time);
        const sortedGroup = group[1].sort((item, otherItem) => {
          const time = DateTime.fromISO(item.timestamp);
          const otherTime = DateTime.fromISO(otherItem.timestamp);
          return otherTime.toUnixInteger() - time.toUnixInteger();
        });
        if (revertTimeRepresentation(time) === TimePartition.Today) {
          return { title: 'TODAY', data: sortedGroup };
        } else if (revertTimeRepresentation(time) === TimePartition.Yesterday) {
          return { title: 'YESTERDAY', data: sortedGroup };
        } else if (revertTimeRepresentation(time) === TimePartition.ThisWeek) {
          return { title: 'THIS WEEK', data: sortedGroup };
        } else if (revertTimeRepresentation(time) === TimePartition.ThisMonth) {
          return { title: 'THIS MONTH', data: sortedGroup };
        } else if (date.hasSame(currentTime, 'year')) {
          return {
            title: date.toFormat('LLLL').toUpperCase(),
            data: sortedGroup,
          };
        } else {
          return {
            title: date.toFormat('LLLL yyyy').toUpperCase(),
            data: sortedGroup,
          };
        }
      });
    const pendingGroup = {
      title: 'PENDING',
      data: filter === 'msg' ? [] : pendingTransactions.data ?? [],
    };
    return pendingGroup.data.length > 0
      ? [pendingGroup, ...historyGroups]
      : historyGroups;
  }, [
    ...spreadLoadable(history),
    ...spreadLoadable(pendingTransactions),
    filter,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: SectionListItem }) =>
      isPendingTransaction(item) ? (
        <PendingTransactionListItem
          proposal={item}
          key={item.id}
          onPress={() => onPressPendingTransaction(item)}
        />
      ) : item.type === IHistoryType.Transaction ? (
        <TransactionListItem
          wallet={wallet}
          key={item.id}
          transaction={item.transaction!}
          onPress={() => onPressTransaction(item.transaction!)}
        />
      ) : item.type === IHistoryType.Message ? (
        <SignedMessageListItem
          message={item.message!}
          key={item.id}
          onPress={() => onPressMessage(item.message!)}
        />
      ) : null,
    [wallet.id],
  );

  const renderHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View className='px-4 py-2'>
        <Text className='text-text-secondary text-xs font-normal'>{title}</Text>
      </View>
    ),
    [],
  );

  const handleRefresh = async () => {
    if (refreshing || syncing) return;
    try {
      setRefreshing(true);
      await minTime(onRefresh(), 500);
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to refresh data',
      });
    }
    setRefreshing(false);
  };

  return (
    <View className='flex h-full w-full flex-1 flex-col'>
      {onLoadable(composeLoadables(history, pendingTransactions)(tuple))(
        () => (
          <HistorySectionSkeleton rows={3} />
        ),
        () => (
          <View className='flex flex-col'>
            <HistoryListItemSkeleton fixed />
            <HistoryListItemSkeleton fixed />
            <View className='-mt-4 items-center justify-center'>
              <CardErrorState
                title='Unable to get History'
                description='Something went wrong trying to get your wallet history.'
              />
            </View>
          </View>
        ),
        () => (
          <View className='flex h-full w-full flex-1 flex-col'>
            {timeGroups.length === 0 ? (
              <View className='flex flex-col'>
                <HistoryListItemSkeleton fixed />
                <HistoryListItemSkeleton fixed />
                <View className='-mt-4 items-center justify-center px-8'>
                  <CardEmptyState
                    icon={
                      filter === 'all'
                        ? EmptyHistory
                        : filter === 'tx'
                        ? EmptyTransactions
                        : EmptyMessages
                    }
                    title={
                      filter === 'all'
                        ? 'No Activity'
                        : filter === 'tx'
                        ? 'No Transactions'
                        : 'No Messages'
                    }
                    description={
                      filter === 'all'
                        ? 'All activity related to your wallet will show up here.'
                        : filter === 'tx'
                        ? 'All transactions affecting your wallet will show up here.'
                        : `All messages you've signed will show up here.`
                    }
                  />
                </View>
              </View>
            ) : (
              <SectionList<SectionListItem, SectionListSection>
                sections={timeGroups}
                estimatedItemSize={adjust(64)}
                renderItem={renderItem}
                renderSectionHeader={renderHeader}
                onEndReached={onLoadMore}
                onRefresh={handleRefresh}
                refreshing={refreshing || syncing}
                keyExtractor={(item) => item.id}
                ListFooterComponent={
                  <View
                    style={{
                      paddingBottom: inset.bottom + walletDetailBottomTabOffset,
                    }}
                  />
                }
                refreshControl={
                  <RefreshControl
                    colors={[colors.primary]}
                    progressBackgroundColor={colors.cardHighlight}
                    tintColor={colors.primary}
                    refreshing={refreshing || syncing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            )}
          </View>
        ),
      )}
    </View>
  );
}

export const HistorySectionSkeleton = (props: { rows: number }) => {
  return (
    <View className='bg-background flex flex-col'>
      {Array(props.rows)
        .fill(0)
        .map((_, i) => {
          return <HistoryListItemSkeleton key={i} />;
        })}
    </View>
  );
};
