import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { LedgerEvmSigner } from '../../keyring/ledger/evm';
import { TrezorEvmSigner } from '../../keyring/trezor';
import { IEvmSigner } from '../../keyring/types';
import { ProviderOptions } from '../provider/types';
import { EthersSigner } from './signer';

export class ExtEthersSigner extends EthersSigner {
  constructor(
    localSigner: IEvmSigner,
    chainId: number,
    wallet: IWallet,
    rpcOptions?: ProviderOptions,
  ) {
    super(chainId, wallet, rpcOptions);
    this.signers.set(IWalletType.Ledger, new LedgerEvmSigner());
    this.signers.set(IWalletType.Trezor, new TrezorEvmSigner());
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
