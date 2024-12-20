import { ISignerWallet } from '@nestwallet/app/common/types';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { useUserContext } from '../provider/user';

export function useSignerById(walletId: string) {
  const { signers } = useUserContext();
  const signer = signers.find((signer) => signer.id === walletId);
  return { signer };
}

export function useSignersByIds(walletIds: string[]) {
  const { signers: allSigners } = useUserContext();
  const signers = allSigners.filter((signer) => walletIds.includes(signer.id));
  return { signers };
}

export function useSignerWallet(wallet: IWallet): ISignerWallet {
  const { signers } = useUserContext();
  const signer = signers.find((signer) => signer.id === wallet.id);
  return signer ?? { ...wallet, hasKeyring: false };
}
