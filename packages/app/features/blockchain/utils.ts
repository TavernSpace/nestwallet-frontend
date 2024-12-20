import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { onBlockchain } from '../chain';
import { isEVMAddress } from '../evm/utils';
import { isSolanaAddress, isSolanaTokenAddress } from '../svm/utils';
import { isTONAddress } from '../tvm/utils';

export function isValidAddress(blockchain: IBlockchainType, address: string) {
  if (address === '') return false;
  return onBlockchain(blockchain)(
    () => isEVMAddress(address),
    () => isSolanaAddress(address),
    () => isTONAddress(address),
  );
}

export function isValidTokenAddress(
  blockchain: IBlockchainType,
  address: string,
) {
  if (address === '') return false;
  return onBlockchain(blockchain)(
    () => isEVMAddress(address),
    () => isSolanaTokenAddress(address),
    () => isTONAddress(address),
  );
}
