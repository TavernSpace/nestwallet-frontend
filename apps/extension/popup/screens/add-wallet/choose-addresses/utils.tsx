import Transport from '@ledgerhq/hw-transport';
import { IKeyring } from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useLedgerFetcher } from '@nestwallet/app/screens/add-wallet/choose-addresses/ledger-fetcher';
import {
  useEvmSeedPhraseFetcher,
  useSvmSeedPhraseFetcher,
  useTvmSeedPhraseFetcher,
} from '@nestwallet/app/screens/add-wallet/choose-addresses/seedphrase-fetcher';
import { useTrezorFetcher } from '@nestwallet/app/screens/add-wallet/choose-addresses/trezor-fetcher';

export const useWalletFetcher = (
  blockchain: IBlockchainType,
  walletType: IWalletType,
  keyring: IKeyring | undefined,
  transport: Transport | undefined,
) => {
  if (blockchain === IBlockchainType.Evm) {
    if (walletType === IWalletType.Ledger) {
      return useLedgerFetcher({ blockchain, transport: transport });
    } else if (walletType === IWalletType.Trezor) {
      return useTrezorFetcher();
    } else {
      return useEvmSeedPhraseFetcher(keyring?.value);
    }
  } else if (blockchain === IBlockchainType.Svm) {
    if (walletType === IWalletType.Ledger) {
      return useLedgerFetcher({ blockchain, transport: transport });
    } else {
      return useSvmSeedPhraseFetcher(keyring?.value);
    }
  } else if (blockchain === IBlockchainType.Tvm) {
    if (walletType === IWalletType.Ledger) {
      return useLedgerFetcher({ blockchain, transport: transport });
    } else {
      return useTvmSeedPhraseFetcher(keyring?.value);
    }
  }
  throw new Error('Unsupported blockchain');
};
