import {
  composeLoadables,
  loadDataFromQuery,
} from '@nestwallet/app/common/utils/query';
import { ActionSheet } from '@nestwallet/app/components/sheet';
import { ChainInfo } from '@nestwallet/app/features/chain';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ConnectionContent } from '@nestwallet/app/molecules/connection/screen';
import { useQueryClient } from '@tanstack/react-query';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import {
  connectedSitesQueryKey,
  useConnectedSiteQuery,
} from '../../../hooks/ui-service';
import { useAppContext } from '../../../provider/application';

export function ConnectionSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
}) {
  const { isShowing, onClose } = props;
  const { walletService } = useAppContext();
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet();
  const queryClient = useQueryClient();

  const connectedSiteQuery = useConnectedSiteQuery();
  const connectedSite = loadDataFromQuery(connectedSiteQuery);

  const selectedWallets = composeLoadables(
    selectedEvmWallet,
    selectedSvmWallet,
    selectedTvmWallet,
  )((evm, svm, tvm) => ({
    evm,
    svm,
    tvm,
  }));

  const handleChainChange = async (chain: ChainInfo) => {
    if (
      connectedSite.success &&
      connectedSite.data.siteInfo &&
      connectedSite.data.connections[IBlockchainType.Evm]
    ) {
      await walletService.setConnectedChainId(
        connectedSite.data.siteInfo.url,
        chain.id,
      );
      await connectedSiteQuery.refetch();
    }
  };

  const handleDisconnect = async (origin: string) => {
    await walletService.disconnect(origin);
    await Promise.all([
      connectedSiteQuery.refetch(),
      queryClient.invalidateQueries({
        queryKey: connectedSitesQueryKey(),
      }),
    ]);
  };

  return (
    <ActionSheet isDetached={true} isShowing={isShowing} onClose={onClose}>
      <ConnectionContent
        connectedSite={connectedSite}
        wallets={selectedWallets}
        onDisconnect={handleDisconnect}
        onChainChange={handleChainChange}
      />
    </ActionSheet>
  );
}
