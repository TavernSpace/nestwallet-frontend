import { ethers } from 'ethers';

export const erc20DecimalsABIInterface = new ethers.Interface([
  'function decimals() view returns (uint8)',
]);

export const erc20TransferABIInterface = new ethers.Interface([
  'function transfer(address to, uint amount)',
]);

export const erc20ApprovalABIInterface = new ethers.Interface([
  'function approve(address _spender, uint256 _value)',
]);

export const erc721TransferFromABIInterface = new ethers.Interface([
  'function transferFrom(address from, address to, uint256 tokenId)',
]);

export const erc1155SafeTransferFromABIInterface = new ethers.Interface([
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
]);
