import {
  IContractVisibility,
  INftBalance,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useEffect } from 'react';
import { minTime } from '../../../common/api/utils';
import { useQueryRefetcher } from '../../../common/hooks/query';
import { loadDataFromQuery, mapLoadable } from '../../../common/utils/query';
import { View } from '../../../components/view';
import { isSupportedChain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import { refreshHapticAsync } from '../../../features/haptic';
import { useNftBalancesInfiniteQuery } from '../../../features/wallet/query';
import { graphqlType } from '../../../graphql/types';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { CollectionsWithData } from './data';
import { NFTDisplay } from './types';

export function WalletCollections(props: {
  wallet: IWallet;
  display: NFTDisplay;
  filteredChain: number;
  managed: boolean;
  modifiedVisibilityMap: Record<string, IContractVisibility>;
  refreshing: boolean;
  onStartRefresh: VoidFunction;
  onEndRefresh: VoidFunction;
  onPressNft: (nft: INftBalance) => void;
  onChangeVisibility: (
    collection: string,
    chainId: number,
    visibility: IContractVisibility,
  ) => void;
}) {
  const {
    wallet,
    display,
    filteredChain,
    managed,
    refreshing,
    modifiedVisibilityMap,
    onStartRefresh,
    onPressNft,
    onEndRefresh,
    onChangeVisibility,
  } = props;
  const { showSnackbar } = useSnackbar();

  const nftBalancesQuery = useQueryRefetcher(
    graphqlType.ContractPermission,
    useNftBalancesInfiniteQuery(
      { walletId: wallet.id },
      { staleTime: 30 * 1000 },
    ),
  );

  const nftBalances = loadDataFromQuery(nftBalancesQuery, (data) =>
    data.pages
      .flatMap((page) =>
        page.nftBalances.edges.map((edge) => edge.node as INftBalance),
      )
      .filter((nft) => isSupportedChain(nft.chainId)),
  );
  const filteredNftBalances = mapLoadable(nftBalances)((nfts) =>
    nfts.filter((nft) => {
      const satisfiesFilter =
        filteredChain === 0 || nft.chainId === filteredChain;
      const isShown = nft.visibility !== IContractVisibility.Hidden;
      return satisfiesFilter && isShown;
    }),
  );

  const handleRefresh = async () => {
    try {
      onStartRefresh();
      await minTime(nftBalancesQuery.refetch(), 500);
      refreshHapticAsync();
    } catch (err) {
      const error = parseError(err, 'Failed to refresh NFTs');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      onEndRefresh();
    }
  };

  const handleLoadMore = async () => {
    if (nftBalancesQuery.hasNextPage) {
      await nftBalancesQuery.fetchNextPage();
    }
  };

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing]);

  return (
    <View className='flex-1'>
      <CollectionsWithData
        wallet={wallet}
        nfts={filteredNftBalances}
        allNfts={nftBalances}
        display={display}
        onPressNft={onPressNft}
        refreshing={refreshing}
        managed={managed}
        modifiedVisibilityMap={modifiedVisibilityMap}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onVisibilityChange={onChangeVisibility}
      />
    </View>
  );
}
