import {
  IContractVisibility,
  ICryptoBalance,
  ICryptoPositionInputType,
  IWallet,
  useCryptoPositionsQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useEffect } from 'react';
import { minTime } from '../../../common/api/utils';
import { useQueryRefetcher } from '../../../common/hooks/query';
import { Loadable, Preferences } from '../../../common/types';
import { loadDataFromQuery, mapLoadable } from '../../../common/utils/query';
import { View } from '../../../components/view';
import { isSupportedChain } from '../../../features/chain';
import { isDust } from '../../../features/crypto/balance';
import {
  aggregateComplexCryptoPositions,
  aggregateSimpleCryptoPositions,
} from '../../../features/crypto/position';
import {
  chainFilter,
  visibilityFilter,
} from '../../../features/crypto/visibility';
import { parseError } from '../../../features/errors';
import { refreshHapticAsync } from '../../../features/haptic';
import { graphqlType } from '../../../graphql/types';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { PositionsWithData, ProtocolsWithData } from './data';

export function WalletPositions(props: {
  wallet: IWallet;
  type: 'asset' | 'position';
  filteredChain: number;
  managed: boolean;
  refreshing: boolean;
  modifiedVisibilityMap: Record<string, IContractVisibility>;
  preferences: Loadable<Preferences>;
  onPressToken: (token: ICryptoBalance) => void;
  onStartRefresh: VoidFunction;
  onEndRefresh: VoidFunction;
  onChangeVisibility: (
    items: ICryptoBalance[],
    visibility: IContractVisibility,
  ) => void;
}) {
  const {
    wallet,
    type,
    filteredChain,
    managed,
    refreshing,
    modifiedVisibilityMap,
    preferences,
    onPressToken,
    onStartRefresh,
    onEndRefresh,
    onChangeVisibility,
  } = props;
  const { showSnackbar } = useSnackbar();

  const cryptoPositionsQuery = useQueryRefetcher(
    graphqlType.ContractPermission,
    useCryptoPositionsQuery(
      { input: { walletId: wallet.id, type: ICryptoPositionInputType.All } },
      { staleTime: 30 * 1000 },
    ),
  );
  const allCryptoPositions = loadDataFromQuery(cryptoPositionsQuery, (data) =>
    data.cryptoPositions.edges
      .map((edge) => edge.node as ICryptoBalance)
      .filter((item) => isSupportedChain(item.chainId) && !isDust(item)),
  );
  const allSimpleCryptoPositions = mapLoadable(allCryptoPositions)((data) =>
    aggregateSimpleCryptoPositions(data),
  );
  const filteredSimpleCryptoPositions = mapLoadable(allCryptoPositions)(
    (data) =>
      aggregateSimpleCryptoPositions(
        data.filter(
          (item) => chainFilter(item, filteredChain) && visibilityFilter(item),
        ),
      ),
  );
  // TODO: do we want to make visibility affect positions too?
  const filteredComplexCryptoPositions = mapLoadable(allCryptoPositions)(
    (data) =>
      aggregateComplexCryptoPositions(
        data.filter((item) => chainFilter(item, filteredChain)),
      ),
  );

  const handleRefresh = async () => {
    try {
      onStartRefresh();
      await minTime(cryptoPositionsQuery.refetch(), 500);
      refreshHapticAsync();
    } catch (err) {
      const error = parseError(err, 'Failed to refresh tokens');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      onEndRefresh();
    }
  };

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing]);

  return (
    <View className='flex-1'>
      {type === 'asset' ? (
        <PositionsWithData
          wallet={wallet}
          allPositions={allSimpleCryptoPositions}
          positions={filteredSimpleCryptoPositions}
          preferences={preferences}
          onPressToken={onPressToken}
          refreshing={refreshing}
          managed={managed}
          modifiedVisibilityMap={modifiedVisibilityMap}
          onRefresh={handleRefresh}
          onVisibilityChange={onChangeVisibility}
        />
      ) : (
        <ProtocolsWithData
          wallet={wallet}
          protocols={filteredComplexCryptoPositions}
          preferences={preferences}
          onPressToken={onPressToken}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}
