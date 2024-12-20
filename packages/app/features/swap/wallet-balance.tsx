import { QueryOptions, useLoadDataFromQuery } from '../../common/utils/query';
import {
  ICryptoBalance,
  ICryptoPositionInputType,
  IWallet,
  useCryptoPositionsQuery,
} from '../../graphql/client/generated/graphql';
import { isSwapSupportedChain } from '../chain';
import { isDust, isSimpleBalance } from '../crypto/balance';
import { visibilityFilter } from '../crypto/visibility';

export function useSwapCryptoBalance(wallet: IWallet, options?: QueryOptions) {
  const cryptoPositionsQuery = useCryptoPositionsQuery(
    { input: { walletId: wallet.id, type: ICryptoPositionInputType.All } },
    { staleTime: Infinity, ...options },
  );
  const cryptoPositions = useLoadDataFromQuery(
    cryptoPositionsQuery,
    (cryptoPositions) => {
      return cryptoPositions.cryptoPositions.edges
        .filter(
          (crypto) =>
            isSwapSupportedChain(crypto.node.chainId) &&
            visibilityFilter(crypto.node) &&
            isSimpleBalance(crypto.node) &&
            !isDust(crypto.node),
        )
        .map((crypto) => crypto.node as ICryptoBalance);
    },
  );
  return cryptoPositions;
}
