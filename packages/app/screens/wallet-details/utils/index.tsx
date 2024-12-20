import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { Tuple } from '../../../common/types';
import { computePNL, isDebt } from '../../../features/crypto/balance';
import {
  ICryptoBalance,
  IOrder,
  IQuest,
  IQuestIdentifier,
} from '../../../graphql/client/generated/graphql';

export function totalBalanceFromCrypto(
  crypto: ICryptoBalance[],
  orders: IOrder[],
) {
  const balance = aggregateBalance(crypto, orders);
  const absoluteChange = crypto.reduce((sum, cur) => {
    return (
      sum +
      (isDebt(cur)
        ? -cur.balanceChange.absolute1D
        : cur.balanceChange.absolute1D)
    );
  }, 0);
  const balanceDiff = balance - absoluteChange;
  return {
    balance,
    absoluteChange,
    percentageChange:
      balance > 0 ? (balanceDiff === 0 ? 0 : absoluteChange / balanceDiff) : 0,
  };
}

export function totalPNLFromCrypto(crypto: ICryptoBalance[], orders: IOrder[]) {
  const balance = aggregateBalance(crypto, orders);
  const [absoluteChange, costBasis] = crypto.reduce(
    (sum, cur) => {
      const [change, percent, costBasis] = computePNL(cur);
      const adjustment =
        costBasis === 0 ? parseFloat(cur.balanceInUSD) : costBasis;
      return [sum[0] + change, sum[1] + adjustment] as Tuple<number, 2>;
    },
    [0, 0] as Tuple<number, 2>,
  );

  return {
    balance,
    absoluteChange,
    percentageChange: costBasis > 0 ? absoluteChange / costBasis : 0,
  };
}

export function claimableQuests(quests: IQuest[]) {
  return quests.filter((quest) => {
    const completed = quest.completion >= 1;
    const isDirectClaimable =
      (quest.id === IQuestIdentifier.MobileDownload && Platform.OS !== 'web') ||
      (quest.id === IQuestIdentifier.ExtensionDownload &&
        Platform.OS === 'web');
    return !completed && (isDirectClaimable || quest.claimableXp > 0);
  });
}

function aggregateBalance(crypto: ICryptoBalance[], orders: IOrder[]) {
  const balance =
    crypto.reduce((sum, cur) => {
      const amount = parseFloat(cur.balanceInUSD);
      return sum + (isDebt(cur) ? -amount : amount);
    }, 0) +
    orders.reduce((sum, cur) => {
      return cur.limitOrder
        ? sum +
            parseFloat(
              ethers.formatUnits(
                cur.limitOrder.fromTokenAmount,
                cur.limitOrder.fromToken.decimals,
              ),
            ) *
              parseFloat(cur.limitOrder.fromToken.price)
        : sum;
    }, 0);
  return balance;
}
