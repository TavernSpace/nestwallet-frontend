import { ConnectedSite } from '@nestwallet/app/common/types';
import {
  composeLoadables,
  makeLoadable,
} from '@nestwallet/app/common/utils/query';
import { ActionSheet } from '@nestwallet/app/components/sheet';
import { ChainInfo } from '@nestwallet/app/features/chain';
import { ConnectionContent } from '@nestwallet/app/molecules/connection/screen';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { useAppContext } from '../../../provider/application';

export function CurrentSiteSheet(props: {
  isShowing: boolean;
  currentSite: ConnectedSite;
  onClose: VoidFunction;
}) {
  const { isShowing, currentSite, onClose } = props;
  const { userService } = useAppContext();
  const { selectedEvmWallet, selectedSvmWallet, selectedTvmWallet } =
    useSelectedWallet();

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
    if (currentSite.siteInfo) {
      await userService.setConnectedChainId(
        currentSite.siteInfo.origin,
        chain.id,
      );
    }
  };

  const handleDisconnect = async () => {
    if (currentSite.siteInfo) {
      await userService.disconnect(currentSite.siteInfo.origin);
      onClose();
    }
  };

  return (
    <ActionSheet isDetached={true} isShowing={isShowing} onClose={onClose}>
      <ConnectionContent
        connectedSite={makeLoadable(currentSite)}
        wallets={selectedWallets}
        onDisconnect={handleDisconnect}
        onChainChange={handleChainChange}
      />
    </ActionSheet>
  );
}
