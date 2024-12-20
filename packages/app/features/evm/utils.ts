import { ethers } from 'ethers';
import { ChainId } from '../chain/chain';
import { nestAddress } from './constants';

export function isEVMAddress(address: string) {
  return (
    address.startsWith('0x') &&
    address.length === 42 &&
    ethers.isAddress(address)
  );
}

export function isSoulbound(chainId: number, address: string) {
  return chainId === ChainId.Polygon && address === nestAddress;
}
