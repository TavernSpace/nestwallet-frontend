import { useQuery } from '@tanstack/react-query';
import {
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from '@ton/ton';
import { tuple } from '../../../common/utils/functions';
import { ChainId } from '../../../features/chain';
import { IProtectedWalletClient } from '../../../features/wallet/service/interface';
import { IWallet } from '../../../graphql/client/generated/graphql';

export function useWalletVersionsQuery(
  wallet: IWallet,
  client: IProtectedWalletClient,
) {
  return useQuery({
    queryKey: ['walletVersionsQuery', wallet.id],
    queryFn: async () => {
      const signer = await client.getTvmSigner(ChainId.Ton, wallet);
      const publicKey = await signer
        .getPublicKey()
        .then((pk) => Buffer.from(pk, 'hex'));
      const v3r1 = WalletContractV3R1.create({ workchain: 0, publicKey });
      const v3r2 = WalletContractV3R2.create({ workchain: 0, publicKey });
      const v4 = WalletContractV4.create({ workchain: 0, publicKey });
      const v5 = WalletContractV5R1.create({ workChain: 0, publicKey });
      const addrParams = { urlSafe: true, bounceable: false };
      return tuple(
        v3r1.address.toString(addrParams),
        v3r2.address.toString(addrParams),
        v4.address.toString(addrParams),
        v5.address.toString(addrParams),
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
