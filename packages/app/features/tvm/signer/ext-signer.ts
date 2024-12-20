import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { LedgerTvmSigner } from '../../keyring/ledger/tvm';
import { ITvmSigner } from '../../keyring/types';
import { BaseTvmSigner } from './base-signer';

export class ExtTvmSigner extends BaseTvmSigner {
  constructor(localSigner: ITvmSigner, wallet: IWallet) {
    super(wallet);
    this.signers.set(IWalletType.Ledger, new LedgerTvmSigner());
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
