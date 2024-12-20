import { createContext, useContext, useMemo } from 'react';
import { IWallet } from '../graphql/client/generated/graphql';

interface IWalletContext {
  wallet: IWallet;
}

interface WalletProps {
  wallet: IWallet;
  children: React.ReactNode;
}

const WalletContext = createContext<IWalletContext>({} as any);

export function WalletContextProvider(props: WalletProps) {
  const { wallet } = props;

  const context = useMemo(
    () => ({
      wallet,
    }),
    [
      wallet.id,
      wallet.hidden,
      wallet.deploymentStatus,
      wallet.deploymentTxHash,
      wallet.creationData,
      wallet.rank,
      wallet.proposalCount,
      wallet.name,
      wallet.initialSyncStatus,
      wallet.profilePicture?.id,
    ],
  );

  return (
    <WalletContext.Provider value={context}>
      {props.children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}
