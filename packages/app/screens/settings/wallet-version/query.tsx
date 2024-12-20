import { loadDataFromQuery } from '../../../common/utils/query';
import { IProtectedWalletClient } from '../../../features/wallet/service/interface';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { WalletVersionScreen } from './screen';
import { useWalletVersionsQuery } from './utils';

interface WalletVersionQueryProps {
  wallet: IWallet;
  wallets: IWallet[];
  client: IProtectedWalletClient;
  onAddWallets: (
    versions: { address: string; version: string }[],
  ) => Promise<void>;
}

export function WalletVersionWithQuery(props: WalletVersionQueryProps) {
  const { wallet, wallets, client, onAddWallets } = props;

  const walletVersionsQuery = useWalletVersionsQuery(wallet, client);
  const walletVersions = loadDataFromQuery(walletVersionsQuery);

  return (
    <WalletVersionScreen
      wallet={wallet}
      wallets={wallets}
      walletVersions={walletVersions}
      onAddWallets={onAddWallets}
    />
  );
}
