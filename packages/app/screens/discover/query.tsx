import { useMemo, useState } from 'react';
import { delay } from '../../common/api/utils';
import { makeLoadable, useLoadDataFromQuery } from '../../common/utils/query';
import { ChainId, onBlockchain } from '../../features/chain';
import {
  ICryptoBalance,
  ITokenDiscoverData,
  ITrendingTokenType,
  IWallet,
  useFavoriteTokensQuery,
  useTrendingTokensDataQuery,
} from '../../graphql/client/generated/graphql';
import { DiscoverScreen } from './screen';
import { DiscoverType } from './types';

export function DiscoverWithQuery(props: {
  wallet: IWallet;
  onTokenPress: (asset: ICryptoBalance) => void;
}) {
  const { wallet, onTokenPress } = props;

  const [chainFilter, setChainFilter] = useState(
    onBlockchain(wallet.blockchain)(
      () => ChainId.Ethereum,
      () => ChainId.Solana,
      () => ChainId.Ton,
    ),
  );
  const [typeFilter, setTypeFilter] = useState<DiscoverType>(DiscoverType.Hot);

  const supportedChain = useMemo(
    () =>
      !![
        ChainId.Ethereum,
        ChainId.Solana,
        ChainId.Base,
        ChainId.BinanceSmartChain,
        ChainId.Arbitrum,
        ChainId.Optimism,
        ChainId.Polygon,
        ChainId.ZkSync,
        ChainId.Avalanche,
      ].find((chain) => chain === chainFilter),
    [chainFilter],
  );

  const trendingTokensQuery = useTrendingTokensDataQuery(
    { input: { chainId: chainFilter, type: ITrendingTokenType.Rank } },
    {
      staleTime: 60 * 1000,
      enabled: typeFilter === DiscoverType.Hot && supportedChain,
    },
  );
  // TODO: make trending tokens query return TokenDiscoverData[] after we switch to codex
  const trendingTokens = useLoadDataFromQuery(trendingTokensQuery, (data) =>
    data.trendingTokensData.map(
      (trendingData): ITokenDiscoverData => ({
        address: trendingData.address,
        chainId: chainFilter,
        name: trendingData.name,
        symbol: trendingData.symbol,
        logoUrl: trendingData.logoURI,
        decimals: trendingData.decimals,
        price: trendingData.price,
        priceChange1h: trendingData.priceChange1h,
        priceChange24h: trendingData.priceChange24h,
        marketCap: trendingData.marketCap,
        liquidity: trendingData.liquidity,
        volume1h: trendingData.volume1hUSD,
        volume24h: trendingData.volume24hUSD,
      }),
    ),
  );

  const favoriteTokensQuery = useFavoriteTokensQuery(
    { blockchain: wallet.blockchain },
    { staleTime: 60 * 1000, enabled: typeFilter === DiscoverType.Favorites },
  );
  const favoriteTokens = useLoadDataFromQuery(
    favoriteTokensQuery,
    (data) => data.favoriteTokens,
  );

  const tokens =
    typeFilter === DiscoverType.Hot
      ? supportedChain
        ? trendingTokens
        : makeLoadable([])
      : typeFilter === DiscoverType.New
      ? makeLoadable([])
      : favoriteTokens;

  const handleRefresh = async () => {
    if (typeFilter === DiscoverType.Hot && trendingTokensQuery.isStale) {
      await trendingTokensQuery.refetch();
    } else if (typeFilter === DiscoverType.Favorites) {
      await favoriteTokensQuery.refetch();
    } else {
      await delay(1000);
    }
  };

  return (
    <DiscoverScreen
      wallet={wallet}
      chainFilter={chainFilter}
      typeFilter={typeFilter}
      tokens={tokens}
      onTokenPress={onTokenPress}
      onChainChange={(chain) => setChainFilter(chain)}
      onTypeChange={(type) => setTypeFilter(type)}
      onRefreshTrending={handleRefresh}
    />
  );
}
