import { IPersonalWallet } from '../../../common/types';
import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { ISvmSigner } from '../../keyring/types';
import { AbstractSvmSigner } from './types';

export class BaseSvmSigner implements AbstractSvmSigner {
  private personalWallet: IPersonalWallet;
  protected signers: Map<IWalletType, ISvmSigner>;

  constructor(wallet: IWallet) {
    this.personalWallet = {
      address: wallet.address,
      keyringIdentifier: wallet.keyringIdentifier!,
      derivationPath: wallet.derivationPath!,
      type: wallet.type,
    };
    this.signers = new Map<IWalletType, ISvmSigner>();
  }

  public async signMessage(message: string): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    return signer.signSvmMessage(this.personalWallet, message);
  }

  public async signTransactions(transactions: string[]): Promise<string[]> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    const results: string[] = [];
    for (const transaction of transactions) {
      const signature = await signer.signSvmTransaction(
        this.personalWallet,
        transaction,
      );
      results.push(signature);
    }
    return results;
  }
}
