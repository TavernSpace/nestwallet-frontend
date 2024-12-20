import { nullAddress } from '../evm/constants';
import { nativeSolAddress } from '../svm/constants';
import { nativeTonAddress } from '../tvm/constants';

export function cryptoKey(balance?: { address: string; chainId: number }) {
  return balance ? `${balance.address}:${balance.chainId}` : '';
}

export function isNativeAddress(address: string) {
  return (
    address === nativeSolAddress ||
    address === nullAddress ||
    address === nativeTonAddress
  );
}
