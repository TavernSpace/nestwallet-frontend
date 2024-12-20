import {
  IWallet,
  IWalletDeploymentStatus,
  useUpdateWalletDeploymentStatusMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useEffect } from 'react';
import { useMutationEmitter } from '../../common/hooks/query';
import { graphqlType } from '../../graphql/types';
import { getJSONRPCProvider } from '../evm/provider';
import { getSafeApiKit } from '../safe/utils';

export function useWalletDeploymentStatus(wallet: IWallet) {
  const updateWalletDeploymentStatusMutation = useMutationEmitter(
    graphqlType.Wallet,
    useUpdateWalletDeploymentStatusMutation(),
  );
  useEffect(() => {
    if (wallet.deploymentStatus === IWalletDeploymentStatus.Deployed) {
      return;
    }
    const safeApi = getSafeApiKit(wallet.chainId);
    const interval = setInterval(async () => {
      try {
        if (
          wallet.deploymentTxHash &&
          wallet.deploymentStatus === IWalletDeploymentStatus.Deploying
        ) {
          const provider = getJSONRPCProvider(wallet.chainId);
          const tx = await provider.getTransaction(wallet.deploymentTxHash);
          if (!tx) {
            await updateWalletDeploymentStatusMutation.mutateAsync({
              input: {
                id: wallet.id,
                deploymentStatus: IWalletDeploymentStatus.Undeployed,
              },
            });
          }
        }
        // TODO: should we add some reorg logic here or do it all in the backend?
        const safeCreation = await safeApi.getSafeCreationInfo(wallet.address);
        await updateWalletDeploymentStatusMutation.mutateAsync({
          input: {
            id: wallet.id,
            txHash: safeCreation.transactionHash,
            deploymentStatus: IWalletDeploymentStatus.Deployed,
          },
        });
        clearInterval(interval);
      } catch (err) {
        if (
          wallet.deploymentTxHash &&
          wallet.deploymentStatus === IWalletDeploymentStatus.Deploying
        ) {
          const provider = getJSONRPCProvider(wallet.chainId);
          const tx = await provider.getTransactionReceipt(
            wallet.deploymentTxHash,
          );
          if (tx?.status === 0) {
            await updateWalletDeploymentStatusMutation.mutateAsync({
              input: {
                id: wallet.id,
                deploymentStatus: IWalletDeploymentStatus.Undeployed,
              },
            });
          }
        }
        // safe not indexed by Safe tx service yet, try again in 5 sec
      }
    }, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [wallet]);
}
