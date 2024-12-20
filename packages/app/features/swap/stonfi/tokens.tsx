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
import { useStonFiTokensQuery } from './utils';

export function useSwappableStonFiTokensQuery(
  cryptoBalances: Loadable<ICryptoBalance[]>,
  options?: QueryOptions,
) {
  const stonFiTokensQuery = useStonFiTokensQuery(options);
  const stonFiTokens = loadDataFromQuery(stonFiTokensQuery);

  const swappableTokens = useMemo(() => {
    return composeLoadables(
      cryptoBalances,
      stonFiTokens,
    )((cryptoBalancesData, stonFiTokensData) => {
      return getSwappableTokens(
        cryptoBalancesData,
        { [ChainId.Ton]: stonFiTokensData },
        IBlockchainType.Tvm,
      );
    });
  }, [...spreadLoadable(cryptoBalances), ...spreadLoadable(stonFiTokens)]);
  return swappableTokens;
}
