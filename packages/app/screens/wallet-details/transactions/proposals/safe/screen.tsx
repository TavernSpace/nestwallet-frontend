import { SafeInfoResponse } from '@safe-global/api-kit';
import _, { isNil } from 'lodash';
import { useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import EmptyTransactions from '../../../../../assets/images/empty-transactions.svg';
import { minTime } from '../../../../../common/api/utils';
import { useNavigationOptions } from '../../../../../common/hooks/navigation';
import { Loadable, VoidPromiseFunction } from '../../../../../common/types';
import { tuple } from '../../../../../common/utils/functions';
import {
  composeLoadables,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../../../../common/utils/query';
import { adjust } from '../../../../../common/utils/style';
import { WarningBanner } from '../../../../../components/banner/warning';
import { RefreshButton } from '../../../../../components/button/refresh-button';
import {
  CardEmptyState,
  CardErrorState,
} from '../../../../../components/card/card-empty-state';
import { SectionList } from '../../../../../components/flashlist/section-list';
import { QueueListItemSkeleton } from '../../../../../components/skeleton/list-item';
import { Text } from '../../../../../components/text';
import { View } from '../../../../../components/view';
import { colors } from '../../../../../design/constants';
import { parseError } from '../../../../../features/errors';
import { refreshHapticAsync } from '../../../../../features/haptic';
import {
  filterPendingSafeMessageProposals,
  filterPendingSafeTransactionProposals,
} from '../../../../../features/proposal/utils';
import { useSafeAreaInsets } from '../../../../../features/safe-area';
import {
  ISafeMessageProposal,
  ISafeTransactionProposal,
  IWallet,
  IWalletDeploymentStatus,
} from '../../../../../graphql/client/generated/graphql';
import {
  SafeMessageProposalListItem,
  SafeTransactionProposalListItem,
} from '../../../../../molecules/proposal/list';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../../provider/snackbar';
import { SyncSheet } from '../../sync-sheet';

type SectionListItem = ISafeTransactionProposal | ISafeMessageProposal;
type SectionListSection = {
  title: string;
  order: number;
  data: SectionListItem[];
};

function isTransactionProposal(
  item: ISafeTransactionProposal | ISafeMessageProposal,
): item is ISafeTransactionProposal {
  return 'operation' in item;
}

function groupByNonce(proposals: ISafeTransactionProposal[]) {
  return _.chain(proposals)
    .groupBy((proposal) => proposal.safeNonce)
    .toArray()
    .value();
}

interface SafeProposalsScreenProps {
  wallet: IWallet;
  safeInfo: Loadable<SafeInfoResponse>;
  messageProposals: Loadable<ISafeMessageProposal[]>;
  transactionProposals: Loadable<ISafeTransactionProposal[]>;
  onPressMessageProposal: (message: ISafeMessageProposal) => void;
  onPressTransactionProposal: (proposal: ISafeTransactionProposal) => void;
  onRefresh: VoidPromiseFunction;
  onSync: VoidPromiseFunction;
}

export function SafeProposalsScreen(props: SafeProposalsScreenProps) {
  const {
    wallet,
    safeInfo,
    messageProposals,
    transactionProposals,
    onPressMessageProposal,
    onPressTransactionProposal,
    onRefresh,
    onSync,
  } = props;
  const { showSnackbar } = useSnackbar();
  const inset = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [showSyncSheet, setShowSyncSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string>();

  useNavigationOptions({
    headerRight: () => (
      <RefreshButton refreshing={isSyncing} onPress={handleSync} />
    ),
  });

  const handleSync = async () => {
    if (isSyncing) return;
    try {
      setSyncError(undefined);
      setShowSyncSheet(true);
      setIsSyncing(true);
      await onSync();
    } catch (err) {
      const error = parseError(err, 'Failed to sync proposals');
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await minTime(onRefresh(), 500);
      refreshHapticAsync();
    } catch (err) {
      const error = parseError(err, 'Failed to get proposals');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
    setRefreshing(false);
  };

  const transactionProposalData = useMemo(
    () =>
      composeLoadables(
        safeInfo,
        transactionProposals,
      )((safeInfo, proposals) => {
        const pending = filterPendingSafeTransactionProposals(
          proposals,
          safeInfo.nonce,
        );
        const next = pending.filter(
          (proposal) => proposal.safeNonce === safeInfo.nonce,
        );
        const queued = pending.filter(
          (proposal) =>
            _.isNil(proposal.safeNonce) || proposal.safeNonce > safeInfo.nonce,
        );
        const nonces = pending
          .map((proposal) => proposal.safeNonce)
          .filter((nonce): nonce is number => !_.isNil(nonce));
        return {
          next,
          queued,
          nonces,
        };
      }),
    [...spreadLoadable(safeInfo), ...spreadLoadable(transactionProposals)],
  );

  const messageProposalData = useMemo(
    () =>
      mapLoadable(messageProposals)((messages) =>
        filterPendingSafeMessageProposals(messages),
      ),
    [...spreadLoadable(messageProposals)],
  );

  if (wallet.deploymentStatus !== IWalletDeploymentStatus.Deployed) {
    return (
      <View className='flex flex-col'>
        <QueueListItemSkeleton fixed />
        <QueueListItemSkeleton fixed />
        <View className='-mt-4 items-center justify-center px-8'>
          <QueueInactiveState />
        </View>
      </View>
    );
  }

  return (
    <View className='absolute h-full w-full'>
      {onLoadable(
        composeLoadables(
          transactionProposalData,
          messageProposalData,
          safeInfo,
        )(tuple),
      )(
        // TODO: do we want to load proposals + messages seperately?
        () => (
          <QueueSectionSkeleton rows={3} />
        ),
        () => (
          <View className='flex flex-col'>
            <QueueListItemSkeleton fixed />
            <QueueListItemSkeleton fixed />
            <View className='-mt-4 items-center justify-center'>
              <CardErrorState
                title='Unable to get Proposals'
                description='Something went wrong trying to get your proposals.'
              />
            </View>
          </View>
        ),
        ([transactionProposalData, messageProposalData, safeInfo]) => {
          const pendingLength =
            transactionProposalData.next.length +
            transactionProposalData.queued.length +
            messageProposalData.length;
          if (pendingLength === 0) {
            return (
              <View className='flex flex-col'>
                <QueueListItemSkeleton fixed />
                <QueueListItemSkeleton fixed />
                <View className='-mt-4 items-center justify-center px-8'>
                  <QueueEmptyState />
                </View>
              </View>
            );
          }
          const groups = groupByNonce(transactionProposalData.queued);
          const sections: SectionListSection[] = [];
          if (transactionProposalData.next.length > 0) {
            sections.push({
              title: 'NEXT TRANSACTION',
              order: 0,
              data: transactionProposalData.next,
            });
          }
          if (transactionProposalData.queued.length > 0) {
            sections.push({
              title: 'QUEUE',
              order: 0,
              data: [],
            });
          }
          groups.forEach((group, index) =>
            sections.push({
              title: 'QUEUE',
              order: index + 1,
              data: group,
            }),
          );
          if (messageProposalData.length > 0) {
            sections.push({
              title: 'MESSAGES',
              order: 0,
              data: messageProposalData,
            });
          }

          const renderItem = ({
            item,
          }: {
            item: ISafeTransactionProposal | ISafeMessageProposal;
          }) =>
            isTransactionProposal(item) ? (
              <SafeTransactionProposalListItem
                proposal={item}
                safeInfo={safeInfo}
                key={`transaction_proposal:${item.id}`}
                onPress={() => onPressTransactionProposal(item)}
              />
            ) : (
              <SafeMessageProposalListItem
                message={item}
                key={`message_proposal:${item.id}`}
                onPress={() => onPressMessageProposal(item)}
              />
            );

          const renderHeader = ({
            section,
          }: {
            section: SectionListSection;
          }) => {
            const { title, order, data } = section;
            if (order === 0) {
              return (
                <View className='flex w-full flex-col'>
                  <Text className='text-text-secondary px-4 pt-4 text-xs font-normal'>
                    {title}
                  </Text>
                  {title === 'NEXT TRANSACTION' &&
                    transactionProposalData.next.length > 1 && (
                      <DuplicateBanner nonce={safeInfo.nonce} />
                    )}
                </View>
              );
              // This can only happen in the queued transaction proposals (messages always have order 0)
            } else {
              const proposals = data as ISafeTransactionProposal[];
              return proposals.length > 1 && !isNil(proposals[0]!.safeNonce) ? (
                <DuplicateBanner nonce={proposals[0]!.safeNonce} />
              ) : null;
            }
          };

          return (
            <View className='absolute h-full w-full'>
              <SectionList<SectionListItem, SectionListSection>
                sections={sections}
                estimatedItemSize={adjust(60)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderHeader}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                ListFooterComponent={
                  <View style={{ paddingBottom: inset.bottom + 48 }} />
                }
                refreshControl={
                  <RefreshControl
                    colors={[colors.primary]}
                    progressBackgroundColor={colors.cardHighlight}
                    tintColor={colors.primary}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            </View>
          );
        },
      )}
      <SyncSheet
        isShowing={showSyncSheet}
        isSyncing={isSyncing}
        error={syncError}
        onClose={() => setShowSyncSheet(false)}
      />
    </View>
  );
}

function DuplicateBanner(props: { nonce: number }) {
  const { nonce } = props;

  return (
    <View className='bg-background px-4 pt-2'>
      <WarningBanner
        title={`Duplicate nonce ${nonce}`}
        subtitle='Duplicate Nonce'
        body={`Multiple proposals with the nonce ${nonce} exist. When one of these proposals are executed, others with the same nonce will be rejected.`}
        borderRadius={12}
      />
    </View>
  );
}

const QueueEmptyState = () => {
  return (
    <CardEmptyState
      icon={EmptyTransactions}
      title='No Pending Proposals'
      description='You can sync transactions from Safe using the button on the top right.'
    />
  );
};

const QueueInactiveState = () => {
  return (
    <CardEmptyState
      icon={EmptyTransactions}
      title='No Pending Proposals'
      description='Activate your Safe to start sending transactions'
    />
  );
};

const QueueSectionSkeleton = (props: { rows: number }) => {
  return (
    <View className='bg-background flex flex-col'>
      {Array(props.rows)
        .fill(0)
        .map((_, i) => {
          return <QueueListItemSkeleton key={i} />;
        })}
    </View>
  );
};
