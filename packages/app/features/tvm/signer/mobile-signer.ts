import {
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ITvmSigner } from '../../keyring/types';
import { BaseTvmSigner } from './base-signer';

export class MobileTvmSigner extends BaseTvmSigner {
  constructor(localSigner: ITvmSigner, wallet: IWallet) {
    super(wallet);
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
