import { useQueryRefetcher } from '../../../../common/hooks/query';
import { Nullable } from '../../../../common/types';
import {
  loadDataFromQuery,
  makeLoadable,
} from '../../../../common/utils/query';
import { isSupportedChain } from '../../../../features/chain';
import { useHistoryInfiniteQuery } from '../../../../features/history/query';
import {
  IHistory,
  IMessageProposal,
  ITransaction,
  ITransactionProposal,
  IWallet,
  IWalletType,
  useTransactionProposalsQuery,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { HistoryType } from '../types';
import { HistoryScreen } from './screen';

function filterTransaction(
  tx: Nullable<ITransaction>,
  spam: boolean,
  chainId?: number,
) {
  if (!tx) return false;
  // Need to check that tx is not a proposal since zerion seems to mark all non-transfer tx as trash
  const isSpamFiltered = !spam && tx.isSpam && !tx.proposal;
  return chainId ? tx.chainId === chainId && !isSpamFiltered : !isSpamFiltered;
}

function filterMessage(
  message: Nullable<IMessageProposal>,
  spam: boolean,
  chainId?: number,
) {
  if (!message) return false;
  return !chainId;
}

interface HistoryQueryProps {
  wallet: IWallet;
  type: HistoryType;
  filter?: { chainId?: number; spam: boolean };
  syncing: boolean;
  onPressTransaction: (transaction: ITransaction) => void;
  onPressPendingTransaction: (proposal: ITransactionProposal) => void;
  onPressMessage: (message: IMessageProposal) => void;
}

export function HistoryScreenWithQuery(props: HistoryQueryProps) {
  const { wallet, type, filter, syncing } = props;

  const isSafe = wallet.type === IWalletType.Safe;

  const historyQuery = useQueryRefetcher(
    graphqlType.History,
    useHistoryInfiniteQuery({ walletId: wallet.id }, { staleTime: 1000 * 30 }),
  );

  const pendingTransactionsQuery = useQueryRefetcher(
    graphqlType.PendingTransaction,
    useTransactionProposalsQuery(
      { input: { walletId: wallet.id, pendingOnly: true } },
      { enabled: !isSafe },
    ),
  );

  const history = loadDataFromQuery(historyQuery, (data) =>
    data.pages.flatMap((page) =>
      page.history.edges
        .map((edge) => edge.node as IHistory)
        .filter(
          (item) =>
            !item.transaction || isSupportedChain(item.transaction.chainId),
        )
        .filter(
          (item) =>
            !filter ||
            filterTransaction(item.transaction, filter.spam, filter.chainId) ||
            filterMessage(item.message, filter.spam, filter.chainId),
        ),
    ),
  );

  const pendingTransactions = !isSafe
    ? loadDataFromQuery(pendingTransactionsQuery, (data) =>
        data.transactionProposals.edges.map(
          (edge) => edge.node as ITransactionProposal,
        ),
      )
    : makeLoadable<ITransactionProposal[]>([]);

  const handleLoadMoreHistory = async () => {
    if (historyQuery.hasNextPage) {
      await historyQuery.fetchNextPage();
    }
  };

  // TODO: we should probably just refetch first page here and discard the rest of the pages on refresh
  const handleRefresh = async () => {
    await historyQuery.refetch();
  };

  return (
    <HistoryScreen
      {...props}
      filter={type}
      syncing={syncing}
      history={history}
      pendingTransactions={pendingTransactions}
      onLoadMore={handleLoadMoreHistory}
      onRefresh={handleRefresh}
    />
  );
}
