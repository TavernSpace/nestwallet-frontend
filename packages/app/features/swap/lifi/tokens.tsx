import { useMemo } from 'react';
import { Loadable } from '../../../common/types';
import {
  QueryOptions,
  composeLoadables,
  loadDataFromQuery,
  spreadLoadable,
} from '../../../common/utils/query';
import {
  IBlockchainType,
  ICryptoBalance,
} from '../../../graphql/client/generated/graphql';
import { getSwappableTokens } from '../utils';
import { useLifiTokensQuery } from './utils';

export function useSwappableLifiTokensQuery(
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
) {
  const lifiTokensQuery = useLifiTokensQuery({
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime,
  });
  const lifiTokensLoadable = loadDataFromQuery(lifiTokensQuery);

  const swappableTokens = useMemo(() => {
    return composeLoadables(
      cryptoBalances,
      lifiTokensLoadable,
    )((cryptoBalancesData, lifiTokensData) =>
      getSwappableTokens(
        cryptoBalancesData,
        lifiTokensData,
        IBlockchainType.Evm,
      ),
    );
  }, [
    ...spreadLoadable(cryptoBalances),
    ...spreadLoadable(lifiTokensLoadable),
  ]);
  return swappableTokens;
}
