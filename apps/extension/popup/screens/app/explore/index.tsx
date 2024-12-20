import {
  loadDataFromQuery,
  mapLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  IDapp,
  IDappCategory,
  useSuggestedDappsQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useConnectedSitesQuery } from '../../../hooks/ui-service';
import { useAppContext } from '../../../provider/application';
import { ExploreScreen } from './screen';

export function WalletExplore() {
  const { walletService } = useAppContext();

  const connectedSitesQuery = useConnectedSitesQuery();
  const connectedSites = loadDataFromQuery(connectedSitesQuery, (data) =>
    Object.entries(data).map(([url, connectionData]) => ({
      url,
      title: connectionData.title ?? new URL(url).hostname,
    })),
  );

  const suggestedDappsQuery = useSuggestedDappsQuery();
  const suggestedDapps = loadDataFromQuery(
    suggestedDappsQuery,
    (data) => data.suggestedDapps as IDapp[],
  );

  const tradingDapps = mapLoadable(suggestedDapps)((dapps) =>
    dapps.filter((dapp) => dapp.category === IDappCategory.Trading),
  );
  const defiDapps = mapLoadable(suggestedDapps)((dapps) =>
    dapps.filter((dapp) => dapp.category === IDappCategory.Defi),
  );
  const nftDapps = mapLoadable(suggestedDapps)((dapps) =>
    dapps.filter((dapp) => dapp.category === IDappCategory.Nft),
  );

  const handleDisconnect = async (origin: string) => {
    await walletService.disconnect(origin);
    await connectedSitesQuery.refetch();
  };

  const handleDisconnectAll = async () => {
    await walletService.disconnectAll();
    await connectedSitesQuery.refetch();
  };

  return (
    <ExploreScreen
      tradingDapps={tradingDapps}
      defiDapps={defiDapps}
      nftDapps={nftDapps}
      connectedSites={connectedSites}
      onDisconnect={handleDisconnect}
      onDisconnectAll={handleDisconnectAll}
    />
  );
}
