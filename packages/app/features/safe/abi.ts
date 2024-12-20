import { ethers } from 'ethers';

export const safeAddOwnerWithThresholdABIInterface = new ethers.Interface([
  'function addOwnerWithThreshold(address owner, uint256 _threshold)',
]);

export const safeRemoveOwnerABIInterface = new ethers.Interface([
  'function removeOwner(address prevOwner, address owner, uint256 _threshold)',
]);

export const safeSwapOwnerABIInterface = new ethers.Interface([
  'function swapOwner(address prevOwner, address oldOwner, address newOwner)',
]);

export const changeThresholdABIInterface = new ethers.Interface([
  'function changeThreshold(uint256 _threshold)',
]);

export const multiSendABIInterface = new ethers.Interface([
  'function multiSend(bytes memory transactions)',
]);

export const setupABIInterface = new ethers.Interface([
  'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver)',
]);

export const createProxyWithNonceInterface = new ethers.Interface([
  'function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce)',
]);

export const execTransactionABIInterface = new ethers.Interface([
  'function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes memory signatures)',
]);
