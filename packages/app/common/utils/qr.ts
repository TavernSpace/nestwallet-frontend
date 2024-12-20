import { ethers } from 'ethers';
import { onBlockchain } from '../../features/chain';
import { isEVMAddress } from '../../features/evm/utils';
import { isSolanaAddress } from '../../features/svm/utils';
import { isTONAddress, normalizeTONAddress } from '../../features/tvm/utils';
import { IBlockchainType } from '../../graphql/client/generated/graphql';

export function parseLinkSignerQRCode(data: string) {
  const parsedData = data.split(':');
  if (parsedData.length !== 2) {
    return undefined;
  }
  const userId = parsedData[0]!;
  const token = parsedData[1]!;
  return {
    userId,
    token,
  };
}

export function parseAddressQRCode(data: string, blockchain: IBlockchainType) {
  try {
    return onBlockchain(blockchain)(
      () => (isEVMAddress(data) ? ethers.getAddress(data) : undefined),
      () => (isSolanaAddress(data) ? data : undefined),
      () => (isTONAddress(data) ? normalizeTONAddress(data) : undefined),
    );
  } catch {
    return undefined;
  }
}
