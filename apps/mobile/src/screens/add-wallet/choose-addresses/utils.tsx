import { IKeyring } from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import {
  useEvmSeedPhraseFetcher,
  useSvmSeedPhraseFetcher,
  useTvmSeedPhraseFetcher,
} from '@nestwallet/app/screens/add-wallet/choose-addresses/seedphrase-fetcher';

export const useWalletFetcher = (
  blockchain: IBlockchainType,
  walletType: IWalletType,
  keyring: IKeyring | undefined,
) => {
  if (blockchain === IBlockchainType.Evm) {
    return useEvmSeedPhraseFetcher(keyring?.value);
  } else if (blockchain === IBlockchainType.Svm) {
    return useSvmSeedPhraseFetcher(keyring?.value);
  } else if (blockchain === IBlockchainType.Tvm) {
    return useTvmSeedPhraseFetcher(keyring?.value);
  }

  throw new Error('Unsupported blockchain');
};
