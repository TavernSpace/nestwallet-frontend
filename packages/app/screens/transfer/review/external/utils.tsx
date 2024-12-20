import { ethers } from 'ethers';
import { isCryptoBalance } from '../../../../common/utils/types';
import {
  ICryptoBalance,
  INftBalance,
} from '../../../../graphql/client/generated/graphql';

export function getAmountUSD(
  asset: ICryptoBalance | INftBalance,
  amount: string,
) {
  if (!isCryptoBalance(asset) || amount === '') return 0.0;
  const cryptoBalance = ethers.formatUnits(
    asset.balance,
    asset.tokenMetadata.decimals,
  );
  const base =
    (parseFloat(amount) / parseFloat(cryptoBalance)) *
    parseFloat(asset.balanceInUSD);
  const [whole, decimal] = base.toString().split('.');
  const amountUSD =
    decimal && decimal.length > 2
      ? `${whole}.${decimal.slice(0, 2)}`
      : base.toString();
  return amountUSD;
}
