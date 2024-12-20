import {
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ISvmSigner } from '../../keyring/types';
import { BaseSvmSigner } from './base-signer';

export class MobileSvmSigner extends BaseSvmSigner {
  constructor(localSigner: ISvmSigner, wallet: IWallet) {
    super(wallet);
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
