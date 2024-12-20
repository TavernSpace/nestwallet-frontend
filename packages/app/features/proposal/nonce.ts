import { useQuery } from '@tanstack/react-query';
import _, { isEmpty } from 'lodash';
import { SafeNonceData } from '../../common/types';
import {
  QueryOptions,
  loadDataFromQuery,
  mapLoadable,
} from '../../common/utils/query';
import {
  ISafeTransactionProposal,
  useTransactionProposalsQuery,
} from '../../graphql/client/generated/graphql';
import { getJSONRPCProvider } from '../evm/provider';

export function getLatestSafeNonce(
  proposals: ISafeTransactionProposal[],
  nonce: number,
) {
  const nonces = proposals
    .filter((proposal) => proposal.safeTxHash)
    .map((proposal) => proposal.safeNonce ?? -1);
  const maxNonce = Math.max(-1, ...nonces);
  const latestNonce = maxNonce < nonce ? nonce - 1 : maxNonce;
  return latestNonce;
}

export function isRejectionSafeTransactionProposal(
  proposal: ISafeTransactionProposal,
) {
  return (
    isEmpty(proposal.data) &&
    BigInt(proposal.value) === 0n &&
    proposal.toAddress === proposal.wallet.address
  );
}

export function useSafeNonceDataQuery(
  walletId: string,
  baseNonce: number,
  options?: QueryOptions,
) {
  const proposalsQuery = useTransactionProposalsQuery(
    {
      input: {
        walletId,
        pendingOnly: true,
      },
    },
    options,
  );

  const proposals = loadDataFromQuery(proposalsQuery, (data) =>
    data.transactionProposals.edges.map(
      (edge) => edge.node.safe! as ISafeTransactionProposal,
    ),
  );

  const nonceData = mapLoadable(proposals)(
    (proposals): SafeNonceData => ({
      latestNonce: getLatestSafeNonce(proposals, baseNonce),
      nonces: proposals
        .map((proposal) => proposal.safeNonce)
        .filter((nonce): nonce is number => !_.isNil(nonce)),
    }),
  );

  return {
    data: nonceData.data,
    isPending: nonceData.loading,
    isSuccess: nonceData.success,
    isError: nonceData.error,
    refetch: proposalsQuery.refetch,
  };
}

export function getAddressLatestNonce(address: string, chainId: number) {
  const provider = getJSONRPCProvider(chainId);
  return provider.getTransactionCount(address, 'latest');
}

export function useAddressLatestNonceQuery(
  address: string,
  chainId: number,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['addressLatestNonceQuery', address, chainId],
    queryFn: () => getAddressLatestNonce(address, chainId),
    ...options,
  });
}
