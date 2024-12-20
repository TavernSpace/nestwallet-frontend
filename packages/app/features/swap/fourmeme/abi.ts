import { ethers } from 'ethers';

export const fourMemeContractAddress =
  '0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC';

export const purchaseTokenABIInterface = new ethers.Interface([
  'function purchaseTokenAMAP(address tokenAddress, uint256 funds, uint256 minAmount)',
]);

export const saleTokenABIInterface = new ethers.Interface([
  'function saleToken(address tokenAddress, uint256 amount)',
]);
