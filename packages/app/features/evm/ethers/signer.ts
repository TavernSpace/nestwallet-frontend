import {
  AbstractSigner,
  Signer,
  TransactionRequest,
  TransactionResponse,
  TypedDataDomain,
  TypedDataField,
  ethers,
} from 'ethers';
import { IPersonalWallet } from '../../../common/types';
import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { IEvmSigner } from '../../keyring/types';
import {
  sanitizeTransactionRequest,
  sanitizeTypedData,
} from '../../keyring/utils';
import { getJSONRPCProvider } from '../provider';
import { ProviderOptions } from '../provider/types';
import { AbstractEthersSigner } from './types';

export class EthersSigner
  extends AbstractSigner<ethers.JsonRpcApiProvider>
  implements AbstractEthersSigner
{
  private wallet: IWallet;
  private personalWallet: IPersonalWallet;
  protected signers: Map<IWalletType, IEvmSigner>;

  constructor(chainId: number, wallet: IWallet, rpcOptions?: ProviderOptions) {
    super(getJSONRPCProvider(chainId, rpcOptions));
    this.wallet = wallet;
    this.personalWallet = {
      address: wallet.address,
      keyringIdentifier: wallet.keyringIdentifier!,
      derivationPath: wallet.derivationPath!,
      type: wallet.type,
    };
    this.signers = new Map<IWalletType, IEvmSigner>();
  }

  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  connect(provider: ethers.Provider): Signer {
    throw new Error('cannot alter JSON-RPC Signer connection');
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    if (tx.gasLimit) {
      // we need to adjust gasLimit since complicated interactions get
      // dropped sometimes
      tx.gasLimit = BigInt(tx.gasLimit) * 2n;
    }
    return super.sendTransaction(tx);
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    return signer.signEvmMessage(this.personalWallet, message);
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    primaryType?: string,
  ): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    // sanitizeTypedData here to infer primaryType
    const typedData = sanitizeTypedData({
      types,
      domain,
      message,
      primaryType,
    });
    return signer.signEvmTypedData(this.personalWallet, typedData);
  }

  async signTransaction(
    transaction: ethers.TransactionRequest,
  ): Promise<string> {
    const walletType = this.personalWallet.type;
    const signer = this.signers.get(walletType);
    if (!signer) {
      throw new Error(`unsupported wallet type=${walletType}`);
    }
    const txRequest = await sanitizeTransactionRequest(
      this.provider,
      transaction,
    );
    return signer.signEvmTransaction(this.personalWallet, txRequest);
  }
}
