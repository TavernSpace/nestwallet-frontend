import { partition } from 'lodash';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { claimableQuests } from '.';
import { useEffectOnSuccess } from '../../../common/hooks/loading';
import { useQueryRefetcher } from '../../../common/hooks/query';
import { id } from '../../../common/utils/functions';
import {
  mapLoadable,
  spreadLoadable,
  useLoadDataFromQuery,
} from '../../../common/utils/query';
import { onExternalTransactionProposal } from '../../../features/proposal/utils';
import {
  IMintStatus,
  IQuest,
  ITransactionProposal,
  ITransactionStatus,
  IUser,
  IWallet,
  useQuestsQuery,
  useTransactionProposalsQuery,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { useVerifyExecutionContext } from '../../../provider/verify-execution';
import { EoaProposalStatus } from '../types';

export function useEoaWalletManagement(
  wallet: IWallet,
  user: IUser,
  version: string,
) {
  const { verifyTransactionProposals } = useVerifyExecutionContext();

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

  const transactionProposalsQuery = useQueryRefetcher(
    graphqlType.PendingTransaction,
    useTransactionProposalsQuery(
      {
        input: {
          walletId: wallet.id,
          pendingOnly: true,
        },
      },
      { staleTime: 1000 * 30 },
    ),
  );

  const transactionProposals = useLoadDataFromQuery(
    transactionProposalsQuery,
    (data) =>
      data.transactionProposals.edges.map(
        (edge) => edge.node as ITransactionProposal,
      ),
  );

  useEffectOnSuccess(transactionProposals, (pendingTransactions) => {
    verifyTransactionProposals(...pendingTransactions);
  });

  const status = useMemo(
    () =>
      mapLoadable(transactionProposals)((data): EoaProposalStatus => {
        const [pending, dropped] = partition(data, (proposal) => {
          const eoaKey = onExternalTransactionProposal(proposal)(id, id, id);
          return (
            eoaKey!.status === ITransactionStatus.Pending ||
            (eoaKey.status === ITransactionStatus.Confirmed &&
              !!eoaKey!.bridgeStatus)
          );
        });
        return {
          hasPendingProposals: pending.length > 0,
          hasDroppedProposals: dropped.length > 0,
        };
      }),
    [...spreadLoadable(transactionProposals)],
  );

  const claimable = useMemo(
    () =>
      user.nestStatus === IMintStatus.Minted
        ? claimableQuests(questLoadable.data ?? []).length
        : 0,
    [user.nestStatus, ...spreadLoadable(questLoadable)],
  );

  return {
    proposals: transactionProposals,
    proposalStatus: status,
    totalClaimableQuestsCount: claimable,
    totalClaimableLootboxesCount: 0,
  };
}
