import { ethers } from 'ethers';
import { AssetTransfer, TransactionData } from '../../../common/types';
import { isCryptoBalance } from '../../../common/utils/types';
import {
  INftBalance,
  ITokenMetadata,
  ITokenType,
} from '../../../graphql/client/generated/graphql';
import {
  erc1155SafeTransferFromABIInterface,
  erc20ApprovalABIInterface,
  erc20TransferABIInterface,
  erc721TransferFromABIInterface,
} from './abi';

export const getERC20TransferTransactionData = (
  to: string,
  asset: ITokenMetadata,
  amount: string,
): TransactionData => {
  const tokenAmount = ethers.parseUnits(amount, asset.decimals);
  const transferData = erc20TransferABIInterface.encodeFunctionData(
    'transfer',
    [to, tokenAmount],
  );
  return {
    to: asset.address,
    value: ethers.toBeHex(0),
    data: transferData,
  };
};

export const getERC20ApprovalTransactionData = (
  tokenAddress: string,
  spender: string,
  amount: string,
) => {
  const approvalData = erc20ApprovalABIInterface.encodeFunctionData('approve', [
    spender,
    BigInt(amount),
  ]);
  return {
    to: tokenAddress,
    value: ethers.toBeHex(0),
    data: approvalData,
  };
};

export const getNativeTokenTransferTransactionData = (
  to: string,
  asset: ITokenMetadata,
  amount: string,
): TransactionData => {
  const tokenAmount = ethers.parseUnits(amount, asset.decimals);
  return {
    to: ethers.getAddress(to),
    value: ethers.toBeHex(tokenAmount),
    data: '0x',
  };
};

export const getERC721TransferTransactionData = (
  from: string,
  to: string,
  nft: INftBalance,
): TransactionData => {
  const data = erc721TransferFromABIInterface.encodeFunctionData(
    'transferFrom',
    [from, to, nft.tokenId],
  );
  return {
    to: nft.address,
    value: ethers.toBeHex(0),
    data,
  };
};

export const getERC1155TransferTransactionData = (
  from: string,
  to: string,
  nft: INftBalance,
  amount: string,
): TransactionData => {
  const tokenAmount = ethers.toBeHex(ethers.parseUnits(amount, 0));
  const data = erc1155SafeTransferFromABIInterface.encodeFunctionData(
    'safeTransferFrom',
    [from, to, nft.tokenId, tokenAmount, '0x'],
  );
  return {
    to: nft.address,
    value: ethers.toBeHex(0),
    data,
  };
};

export function getTransferTransactionData(
  from: string,
  value: AssetTransfer,
): TransactionData {
  if (!isCryptoBalance(value.asset)) {
    const isERC721Transfer =
      value.asset.collectionMetadata.tokenType === ITokenType.Erc721;
    return isERC721Transfer
      ? getERC721TransferTransactionData(from, value.recipient, value.asset)
      : getERC1155TransferTransactionData(
          from,
          value.recipient,
          value.asset,
          value.value,
        );
  } else {
    const isToken = !value.asset.tokenMetadata.isNativeToken;
    return isToken
      ? getERC20TransferTransactionData(
          value.recipient,
          value.asset.tokenMetadata,
          value.value,
        )
      : getNativeTokenTransferTransactionData(
          value.recipient,
          value.asset.tokenMetadata,
          value.value,
        );
  }
}
