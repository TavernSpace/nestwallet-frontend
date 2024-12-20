import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  IMessageProposal,
  ITransactionProposal,
  IWallet,
} from '../../graphql/client/generated/graphql';

export function useSyncWalletAndProposals(
  proposals: ITransactionProposal[],
  messages: IMessageProposal[],
  wallet: IWallet,
  enabled?: boolean,
) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (
      proposals.length + messages.length < wallet.proposalCount &&
      enabled !== false
    ) {
      queryClient.invalidateQueries({ queryKey: ['CurrentUser'] });
    }
  }, [proposals.length, messages.length, wallet.proposalCount, enabled]);
}
