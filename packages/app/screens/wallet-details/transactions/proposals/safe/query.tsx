import { useQueryRefetcher } from '../../../../../common/hooks/query';
import { VoidPromiseFunction } from '../../../../../common/types';
import { loadDataFromQuery } from '../../../../../common/utils/query';
import { useSafeInfoQuery } from '../../../../../features/safe/queries';
import {
  ISafeMessageProposal,
  ISafeTransactionProposal,
  IWallet,
  IWalletDeploymentStatus,
  useMessageProposalsQuery,
  useTransactionProposalsQuery,
} from '../../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../../graphql/types';
import { SafeProposalsScreen } from './screen';

interface SafeProposalsQueryProps {
  wallet: IWallet;
  onPressMessageProposal: (proposal: ISafeMessageProposal) => void;
  onPressTransactionProposal: (proposal: ISafeTransactionProposal) => void;
  onSync: VoidPromiseFunction;
}

export function SafeProposalsScreenWithQuery(props: SafeProposalsQueryProps) {
  const { wallet } = props;

  const transactionProposalsQuery = useQueryRefetcher(
    graphqlType.Proposal,
    useTransactionProposalsQuery(
      {
        input: {
          walletId: wallet.id,
          pendingOnly: true,
        },
      },
      {
        enabled: wallet.deploymentStatus === IWalletDeploymentStatus.Deployed,
        staleTime: 1000 * 30,
      },
    ),
  );

  const messageProposalsQuery = useQueryRefetcher(
    graphqlType.Message,
    useMessageProposalsQuery(
      {
        input: {
          walletId: wallet.id,
          pendingOnly: true,
        },
      },
      {
        enabled: wallet.deploymentStatus === IWalletDeploymentStatus.Deployed,
        staleTime: 1000 * 30,
      },
    ),
  );

  const safeInfoQuery = useSafeInfoQuery(wallet.chainId, wallet.address);

  const safeTransactionProposals = loadDataFromQuery(
    transactionProposalsQuery,
    (data) =>
      data.transactionProposals.edges.map(
        (edge) => edge.node.safe! as ISafeTransactionProposal,
      ),
  );

  const safeMessageProposals = loadDataFromQuery(
    messageProposalsQuery,
    (data) =>
      data.messageProposals.edges.map(
        (edge) => edge.node.safe! as ISafeMessageProposal,
      ),
  );

  const safeInfo = loadDataFromQuery(safeInfoQuery);

  const handleRefresh = async () => {
    await Promise.all([
      transactionProposalsQuery.refetch(),
      messageProposalsQuery.refetch(),
    ]);
  };

  return (
    <SafeProposalsScreen
      {...props}
      safeInfo={safeInfo}
      transactionProposals={safeTransactionProposals}
      messageProposals={safeMessageProposals}
      onRefresh={handleRefresh}
    />
  );
}
