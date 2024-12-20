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
import { ChainId } from '../../chain';
import { getSwappableTokens } from '../utils';
import { useJupiterTokensQuery } from './utils';

export function useSwappableJupiterTokensQuery(
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
) {
  const jupiterTokensQuery = useJupiterTokensQuery(options);
  const jupiterTokens = loadDataFromQuery(jupiterTokensQuery);

  const swappableTokens = useMemo(() => {
    return composeLoadables(
      cryptoBalances,
      jupiterTokens,
    )((cryptoBalancesData, jupiterTokensData) => {
      return getSwappableTokens(
        cryptoBalancesData,
        { [ChainId.Solana]: jupiterTokensData },
        IBlockchainType.Svm,
      );
    });
  }, [...spreadLoadable(cryptoBalances), ...spreadLoadable(jupiterTokens)]);
  return swappableTokens;
}
