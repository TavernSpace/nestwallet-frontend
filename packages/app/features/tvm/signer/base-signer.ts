import { IPersonalWallet } from '../../../common/types';
import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { ITvmSigner } from '../../keyring/types';
import { AbstractTvmSigner } from './types';

export class BaseTvmSigner implements AbstractTvmSigner {
  private personalWallet: IPersonalWallet;
  protected signers: Map<IWalletType, ITvmSigner>;

  constructor(wallet: IWallet) {
    this.personalWallet = {
      address: wallet.address,
      keyringIdentifier: wallet.keyringIdentifier!,
      derivationPath: wallet.derivationPath!,
      type: wallet.type,
    };
    this.signers = new Map<IWalletType, ITvmSigner>();
  }

  public async signMessage(message: string): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    return signer.signTvmMessage(this.personalWallet, message);
  }

  public async signTransaction(transaction: string): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    const signature = await signer.signTvmTransaction(
      this.personalWallet,
      transaction,
    );
    return signature;
  }

  public async getPublicKey(): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    return signer.getTvmPublicKey(this.personalWallet);
  }
}
