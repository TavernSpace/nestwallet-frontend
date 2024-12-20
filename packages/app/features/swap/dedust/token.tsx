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
import { useDeDustTokensQuery } from './utils';

export function useSwappableDeDustTokensQuery(
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
) {
  const deDustTokensQuery = useDeDustTokensQuery(options);
  const deDustTokens = loadDataFromQuery(deDustTokensQuery);

  const swappableTokens = useMemo(() => {
    return composeLoadables(
      cryptoBalances,
      deDustTokens,
    )((cryptoBalancesData, deDustTokensData) => {
      return getSwappableTokens(
        cryptoBalancesData,
        { [ChainId.Ton]: deDustTokensData },
        IBlockchainType.Tvm,
      );
    });
  }, [...spreadLoadable(cryptoBalances), ...spreadLoadable(deDustTokens)]);
  return swappableTokens;
}
