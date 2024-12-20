import { IApprovalResponse, IKeyring } from '../../../common/types';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { AbstractEthersSigner } from '../../evm/ethers/types';
import { AbstractSvmSigner } from '../../svm/signer/types';
import { AbstractTvmSigner } from '../../tvm/signer/types';

export type SelectedWalletInfo = {
  evm: IWalletInfo | null;
  svm: IWalletInfo | null;
  tvm: IWalletInfo | null;
  latest: IWalletInfo | null;
};

export interface IWalletInfo {
  id: string;
  blockchain: IBlockchainType;
  chainId: number;
  address: string;
  type: IWalletType;
  supportedChainIds?: number[];
}

export interface IProtectedWalletClient {
  readonly isLocked: false;

  getEvmSigner(
    chainId: number,
    wallet: IWallet,
    usePrivateRPC?: boolean,
    useMevProtect?: boolean,
  ): Promise<AbstractEthersSigner>;

  getSvmSigner(chainId: number, wallet: IWallet): Promise<AbstractSvmSigner>;

  getTvmSigner(chainId: number, wallet: IWallet): Promise<AbstractTvmSigner>;

  getKeyring(keyringIdentifier: string): Promise<IKeyring>;

  resolveApproval(input: IApprovalResponse): Promise<void>;
}
