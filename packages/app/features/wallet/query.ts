import { useInfiniteQuery } from '@tanstack/react-query';
import { useFetchData } from '../../common/hooks/graphql';
import { QueryOptions } from '../../common/utils/query';
import {
  INftBalancesQuery,
  INftBalancesQueryVariables,
  NftBalancesDocument,
} from '../../graphql/client/generated/graphql';

export const nftBalancesInfiniteQueryKey = (
  walletId: string,
  cursor?: string,
): [string, string, string | undefined] => ['nftBalances', walletId, cursor];

export const useNftBalancesInfiniteQuery = (
  variables: INftBalancesQueryVariables,
  options?: QueryOptions,
) => {
  const fetchData = useFetchData<INftBalancesQuery, INftBalancesQueryVariables>(
    NftBalancesDocument,
  );
  return useInfiniteQuery({
    initialPageParam: variables.cursor,
    queryKey: nftBalancesInfiniteQueryKey(
      variables.walletId,
      variables.cursor ?? undefined,
    ),
    queryFn: ({ pageParam }) => {
      return fetchData({
        walletId: variables.walletId,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.nftBalances.pageInfo.endCursor ?? undefined,
    ...options,
  });
};
