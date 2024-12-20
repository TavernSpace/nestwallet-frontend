import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { LedgerSvmSigner } from '../../keyring/ledger/svm';
import { ISvmSigner } from '../../keyring/types';
import { BaseSvmSigner } from './base-signer';

export class ExtSvmSigner extends BaseSvmSigner {
  constructor(localSigner: ISvmSigner, wallet: IWallet) {
    super(wallet);
    this.signers.set(IWalletType.Ledger, new LedgerSvmSigner());
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
