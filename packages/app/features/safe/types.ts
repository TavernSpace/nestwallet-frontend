import { SafeCreationInfoResponse } from '@safe-global/api-kit';
import { SafeSignature } from '@safe-global/safe-core-sdk-types';
import { RecipientAccount } from '../../common/types';
import { ChainId } from '../chain';

export interface CreateSafeInput {
  organizationId: string;
  name: string;
  chainId: ChainId;
  signers: RecipientAccount[];
  threshold: number;
  saltNonce: string;
  color?: string;
}

export interface RedeploySafeInput {
  organizationId: string;
  creationInfo: SafeCreationInfoResponse;
  address: string;
  chainId: ChainId;
  originalChainId: number;
  name: string;
  color?: string;
}

export interface SafePredictionInput {
  chainId: number;
  factoryAddress: string;
  creationData: string;
}

export class EthSafeSignature implements SafeSignature {
  signer: string;
  data: string;

  constructor(signer: string, signature: string) {
    this.signer = signer;
    this.data = signature;
  }

  staticPart() {
    return this.data;
  }

  dynamicPart() {
    return '';
  }
}
