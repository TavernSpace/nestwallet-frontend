import {
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { IEvmSigner } from '../../keyring/types';
import { ProviderOptions } from '../provider/types';
import { EthersSigner } from './signer';

export class MobileEthersSigner extends EthersSigner {
  constructor(
    localSigner: IEvmSigner,
    chainId: number,
    wallet: IWallet,
    rpcOptions?: ProviderOptions,
  ) {
    super(chainId, wallet, rpcOptions);
    this.signers.set(IWalletType.PrivateKey, localSigner);
    this.signers.set(IWalletType.SeedPhrase, localSigner);
  }
}
