import { AbstractSigner, ethers } from 'ethers';

export abstract class AbstractEthersSigner extends AbstractSigner<ethers.JsonRpcApiProvider> {
  signTypedData(
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>,
    primaryType?: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
