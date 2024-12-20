import { ethers } from 'ethers';

export function formatEVMAddress(
  account?: string | null,
  isShort?: boolean,
): string | undefined {
  if (!account) {
    return;
  }
  const normalized = ethers.getAddress(account);
  const startLength = isShort ? 4 : 6;
  return `${normalized.substring(0, startLength)}...${normalized.substring(
    normalized.length - 4,
  )}`;
}

export function formatHex(hex: string) {
  if (hex.length <= 10) {
    return hex;
  }
  return `${hex.substring(0, 6)}...${hex.substring(hex.length - 4)}`;
}
