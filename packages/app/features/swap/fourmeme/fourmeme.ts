import { ethers } from 'ethers';
import { TransactionData } from '../../../common/types';
import {
  fourMemeContractAddress,
  purchaseTokenABIInterface,
  saleTokenABIInterface,
} from './abi';

// Function to get unsigned transaction data for purchaseToken
/**
 * @param tokenAddress - address of four.meme token
 * @param tradeAmount - BNB amount to trade, no decimals
 * @param amountWithFee - BNB amount to give to the smart contract, including platform fee, no decimals
 * @param minAmount - min expected token amount (slippage), no decimals.
 */
export function getPurchaseTokenTransactionData(
  tokenAddress: string,
  tradeAmount: string,
  amountWithFee: string,
  minAmount: string,
): TransactionData {
  const txData = purchaseTokenABIInterface.encodeFunctionData(
    'purchaseTokenAMAP',
    [tokenAddress, BigInt(tradeAmount), BigInt(minAmount)],
  );

  return {
    to: fourMemeContractAddress,
    value: ethers.toBeHex(amountWithFee),
    data: txData,
  };
}

// Function to get unsigned transaction data for saleToken
/**
 * @param tokenAddress - address of four.meme token
 * @param amount - token amount to trade, no decimals
 */
export function getSaleTokenTransactionData(
  tokenAddress: string,
  amount: string,
): TransactionData {
  const txData = saleTokenABIInterface.encodeFunctionData('saleToken', [
    tokenAddress,
    BigInt(amount),
  ]);
  return {
    to: fourMemeContractAddress,
    value: ethers.toBeHex(0),
    data: txData,
  };
}
