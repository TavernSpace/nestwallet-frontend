import { useInfiniteQuery } from '@tanstack/react-query';
import { useFetchData } from '../../common/hooks/graphql';
import { QueryOptions } from '../../common/utils/query';
import {
  HistoryDocument,
  IHistoryQuery,
  IHistoryQueryVariables,
} from '../../graphql/client/generated/graphql';

export const historyInfiniteQueryKey = (
  walletId: string,
  cursor?: string,
): [string, string, string | undefined] => ['HistoryPage', walletId, cursor];

export const useHistoryInfiniteQuery = (
  variables: IHistoryQueryVariables,
  options?: QueryOptions,
) => {
  const fetchData = useFetchData<IHistoryQuery, IHistoryQueryVariables>(
    HistoryDocument,
  );
  return useInfiniteQuery({
    initialPageParam: variables.cursor,
    queryKey: historyInfiniteQueryKey(
      variables.walletId,
      variables.cursor ?? undefined,
    ),
    queryFn: ({ pageParam = variables.cursor }) => {
      return fetchData({
        walletId: variables.walletId,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.history.pageInfo.endCursor ?? undefined,
    ...options,
  });
};
