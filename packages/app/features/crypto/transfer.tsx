import { ethers, parseUnits } from 'ethers';
import { isCryptoBalance } from '../../common/utils/types';
import {
  ICryptoBalance,
  INftBalance,
} from '../../graphql/client/generated/graphql';
import { ChainId, getChainInfo } from '../chain';

const defaultGasFeesSend = {
  //used owlracle.info for a lot of these (overestimated these values a bit)
  [ChainId.Arbitrum]: 0.000005,
  [ChainId.Avalanche]: 0.01,
  [ChainId.Base]: 0.00004,
  [ChainId.BinanceSmartChain]: 0.0005,
  [ChainId.Blast]: 0.00004,
  [ChainId.Ethereum]: 0.0005,
  [ChainId.Gnosis]: 0.00008,
  [ChainId.Linea]: 0.0001,
  [ChainId.Optimism]: 0.00004,
  [ChainId.Polygon]: 0.009,
  [ChainId.Scroll]: 0.0001,
  [ChainId.Solana]: 0.001,
  [ChainId.Ton]: 0.01,
  [ChainId.ZkSync]: 0.0001,
  [ChainId.Zora]: 0.00004,
};

const defaultGasFeesSwap = {
  [ChainId.Arbitrum]: 0.00004, //eth
  [ChainId.Avalanche]: 0.05, //avax
  [ChainId.Base]: 0.00015, //eth
  [ChainId.BinanceSmartChain]: 0.001, //bnb
  [ChainId.Blast]: 0.00015, //eth
  [ChainId.Ethereum]: 0.001, //eth
  [ChainId.Gnosis]: 0.0008, //xdai (pegged to usd)
  [ChainId.Linea]: 0.0008, //eth
  [ChainId.Optimism]: 0.0002, //eth
  [ChainId.Polygon]: 0.03, //matic
  [ChainId.Scroll]: 0.0008, //eth
  [ChainId.Solana]: 0.003, //sol
  [ChainId.Ton]: 0.3, //ton
  [ChainId.ZkSync]: 0.0002, //eth
};

const defaultGasFeesBridge = {
  [ChainId.Arbitrum]: 0.00004, //eth
  [ChainId.Avalanche]: 0.05, //avax
  [ChainId.Base]: 0.00015, //eth
  [ChainId.BinanceSmartChain]: 0.001, //bnb
  [ChainId.Blast]: 0.00015, //eth
  [ChainId.Ethereum]: 0.001, //eth
  [ChainId.Gnosis]: 0.0008, //xdai (pegged to usd)
  [ChainId.Linea]: 0.0008, //eth
  [ChainId.Optimism]: 0.0002, //eth
  [ChainId.Polygon]: 0.03, //matic
  [ChainId.Scroll]: 0.0008, //eth
  [ChainId.Solana]: 0.003, //sol
  [ChainId.Ton]: 0.3, //ton
  [ChainId.ZkSync]: 0.0002, //eth
};

export function getMaxBalanceMinusGas(
  balance: ICryptoBalance | INftBalance,
  transactionType: 'swap' | 'send' | 'bridge',
) {
  if (isCryptoBalance(balance)) {
    const chainId = balance.chainId;
    const chainInfo = getChainInfo(chainId);
    let gasFee = 0;
    if (balance.tokenMetadata.isNativeToken) {
      //if not native token, return full balance
      switch (transactionType) {
        case 'send':
          gasFee = defaultGasFeesSend[chainId]!;
          break;
        case 'swap':
          gasFee = defaultGasFeesSwap[chainId]!;
          break;
        case 'bridge':
          gasFee = defaultGasFeesBridge[chainId]!;
          break;
        default:
          gasFee = 0;
      }
    }
    const bigTotalFees = parseUnits(
      gasFee.toString(),
      chainInfo.nativeCurrency.decimals,
    );
    const maxBalanceBn =
      bigTotalFees >= BigInt(balance.balance)
        ? 0n
        : BigInt(balance.balance) - bigTotalFees;
    const maxBalance = ethers.formatUnits(
      maxBalanceBn.toString(),
      balance.tokenMetadata.decimals,
    );
    return maxBalance;
  } else {
    return BigInt(balance.balance).toString();
  }
}

export function validDecimalAmount(value: string, maxDecimals?: number) {
  // 0. replace any , with .
  // 1. remove invalid numbers
  // 2. remove leading zeros
  // 3. ensure there is at most one decimal point
  const replaced = value
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')
    .replace(/^0+(?=\d)/, '')
    .replace(/(\..*)\./g, '$1');
  if (replaced.indexOf('.') >= 0) {
    // Check if the number starts with a decimal point and prefix it with zero
    const num = replaced.startsWith('.') ? '0' + replaced : replaced;
    const [integer, decimal] = num.split('.');
    return maxDecimals === 0
      ? `${integer}`
      : maxDecimals === undefined
      ? `${integer}.${decimal}`
      : `${integer}.${decimal!.slice(0, maxDecimals)}`;
  } else {
    return replaced;
  }
}

export function trimDecimals(input: number, decimals: number) {
  const value = input.toFixed(decimals);
  const hasDecimal = value.indexOf('.') >= 0;
  if (hasDecimal) {
    const parsed = value.replace(/0+$/, '');
    return parsed.endsWith('.') ? parsed.slice(0, -1) : parsed;
  } else {
    return value;
  }
}
