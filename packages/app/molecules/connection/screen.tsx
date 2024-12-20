import { ConnectedSite, Loadable } from '../../common/types';
import { tuple } from '../../common/utils/functions';
import { composeLoadables, onLoadable } from '../../common/utils/query';
import { ChainInfo } from '../../features/chain';
import {
  IBlockchainType,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ConnectedContent } from './connected';
import { DisconnectedContent } from './disconnected';

interface ConnectionContentProps {
  connectedSite: Loadable<ConnectedSite>;
  wallets: Loadable<Record<IBlockchainType, IWallet | null>>;
  onChainChange: (value: ChainInfo) => void;
  onDisconnect: (origin: string) => void;
}

export function ConnectionContent(props: ConnectionContentProps) {
  const { connectedSite, onChainChange, onDisconnect, wallets } = props;

  return onLoadable(composeLoadables(connectedSite, wallets)(tuple))(
    () => null,
    () => null,
    ([connectedSite, wallets]) =>
      Object.keys(connectedSite.connections).length > 0 &&
      connectedSite.siteInfo ? (
        <ConnectedContent
          connectedSite={connectedSite}
          wallets={wallets}
          onChainChange={onChainChange}
          onDisconnect={onDisconnect}
        />
      ) : (
        <DisconnectedContent connectedSite={connectedSite} />
      ),
  );
}
