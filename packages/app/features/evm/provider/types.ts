import { NestWalletClient } from '../../../common/api/nestwallet/client';

export interface ProviderOptions {
  apiClient?: NestWalletClient;
  ensAddress?: string;
  mevProtection?: boolean;
}
