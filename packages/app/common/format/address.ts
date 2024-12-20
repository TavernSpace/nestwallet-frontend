import { formatEVMAddress, formatHex } from './evm';
import { formatBase58, formatSVMAddress } from './svm';

export function formatAddress(address: string, isShort?: boolean) {
  return address.startsWith('0x')
    ? formatEVMAddress(address, isShort)
    : formatSVMAddress(address, isShort);
}

export function formatHash(hash: string) {
  return hash.startsWith('0x') ? formatHex(hash) : formatBase58(hash);
}
