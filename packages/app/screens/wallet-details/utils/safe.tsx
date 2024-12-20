import { Platform } from 'react-native';
import { claimableQuests } from '.';
import { useEffectOnSuccess } from '../../../common/hooks/loading';
import { useQueryRefetcher } from '../../../common/hooks/query';
import {
  loadDataFromQuery,
  useLoadDataFromQuery,
} from '../../../common/utils/query';
import { useSyncWalletAndProposals } from '../../../features/proposal/sync';
import { useSafeInfoQuery } from '../../../features/safe/queries';
import { useWalletDeploymentStatus } from '../../../features/wallet/safe';
import {
  IMessageProposal,
  IMintStatus,
  IQuest,
  ITransactionProposal,
  IUser,
  IWallet,
  IWalletDeploymentStatus,
  useMessageProposalsQuery,
  useQuestsQuery,
  useTransactionProposalsQuery,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { useVerifyExecutionContext } from '../../../provider/verify-execution';

export function useSafeWalletManagement(
  wallet: IWallet,
  user: IUser,
  version: string,
) {
  const { verifyTransactionProposals } = useVerifyExecutionContext();

  const isDeployed =
    wallet.deploymentStatus === IWalletDeploymentStatus.Deployed;

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
        staleTime: 1000 * 30,
        enabled: isDeployed,
      },
    ),
  );
  const transactionProposalsLoadable = loadDataFromQuery(
    transactionProposalsQuery,
    (data) =>
      data.transactionProposals.edges.map(
        (edge) => edge.node as ITransactionProposal,
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
        staleTime: 1000 * 30,
        enabled: isDeployed,
      },
    ),
  );
  const messageProposalsLoadable = loadDataFromQuery(
    messageProposalsQuery,
    (data) =>
      data.messageProposals.edges.map((edge) => edge.node as IMessageProposal),
  );

  const questsQuery = useQuestsQuery(
    {
      filter: {
        os: Platform.OS,
        version: version,
      },
    },
    { staleTime: Infinity },
  );
  const questLoadable = useLoadDataFromQuery(
    questsQuery,
    (data) => data.quests as IQuest[],
  );

  // refetch wallet deployment status
  useWalletDeploymentStatus(wallet);

  // Even though we don't use the Safe info here, its good to start a fetch here
  // to populate the cache so loading other pages which require Safe info is faster (like settings)
  const safeInfoQuery = useSafeInfoQuery(wallet.chainId, wallet.address, {
    enabled: isDeployed,
  });

  useEffectOnSuccess(transactionProposalsLoadable, (proposals) => {
    verifyTransactionProposals(...proposals);
  });

  // Note: this is needed to prevent desync between userContext proposalCount and
  // the proposals fetched by transactionProposals query
  // TODO: also check if we have any proposals which have old safe nonce? This is only relevant
  // when a user executes a safe tx externally and safe does not give us a webhook
  useSyncWalletAndProposals(
    transactionProposalsLoadable.data || [],
    messageProposalsLoadable.data || [],
    wallet,
    transactionProposalsLoadable.success && messageProposalsLoadable.success,
  );

  return {
    totalClaimableQuestsCount:
      user.nestStatus === IMintStatus.Minted
        ? claimableQuests(questLoadable.data ?? []).length
        : 0,
    totalClaimableLootboxesCount: 0,
  };
}
