import { ethers } from 'ethers';
import { partition } from 'lodash';
import {
  IContractVisibility,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';
import { computePNL, isDebt, isSimpleBalance } from './balance';
import { CryptoPositionItem, Protocol, ProtocolGroup } from './types';
import { visibilityFilter } from './visibility';

export function aggregateSimpleCryptoPositions(
  cryptoPositions: ICryptoBalance[],
) {
  const [simple] = partition(cryptoPositions, (token) =>
    isSimpleBalance(token),
  );

  // Group balances by tokenMetadata.id
  const tokenBalanceGroups: Record<string, ICryptoBalance[]> = {};
  simple.forEach((balance) => {
    if (!tokenBalanceGroups[balance.tokenMetadata.id]) {
      tokenBalanceGroups[balance.tokenMetadata.id] = [];
    }
    tokenBalanceGroups[balance.tokenMetadata.id]!.push(balance);
  });

  const groupedPositions: CryptoPositionItem[] = Object.values(
    tokenBalanceGroups,
  )
    .map((balances) => {
      const maxDecimals = Math.max(
        ...balances.map((balance) => balance.tokenMetadata.decimals),
      );
      const balanceAggregate = balances.reduce(
        (prev, balance) => ({
          balance:
            prev.balance +
            BigInt(balance.balance) *
              10n ** BigInt(maxDecimals - balance.tokenMetadata.decimals),
          balanceChange1D:
            prev.balanceChange1D + balance.balanceChange.absolute1D,
          balanceInUSD: prev.balanceInUSD + parseFloat(balance.balanceInUSD),
        }),
        {
          balance: BigInt(0),
          balanceChange1D: 0,
          balanceInUSD: 0,
        },
      );
      const totalCostBasis = balances.reduce((acc, cur) => {
        const [, , costBasis] = computePNL(cur);
        return acc + costBasis;
      }, 0);
      const averagePrice =
        totalCostBasis /
        parseFloat(ethers.formatUnits(balanceAggregate.balance, maxDecimals));
      const balance: ICryptoBalance = {
        address: balances[0]!.address,
        balance: balanceAggregate.balance.toString(),
        balanceChange: {
          absolute1D: balanceAggregate.balanceChange1D,
          percent1D: balances[0]!.balanceChange.percent1D,
        },
        balanceInUSD: balanceAggregate.balanceInUSD.toString(),
        chainId: balances[0]!.chainId,
        tokenMetadata: { ...balances[0]!.tokenMetadata, decimals: maxDecimals },
        averagePriceUSD: averagePrice,
        visibility: balances.some((balance) => visibilityFilter(balance))
          ? IContractVisibility.Shown
          : IContractVisibility.Hidden,
      };
      return {
        balance,
        groupedBalances: balances,
      };
    })
    .sort(
      (balance0, balance1) =>
        parseFloat(balance1.balance.balanceInUSD) -
        parseFloat(balance0.balance.balanceInUSD),
    );

  return groupedPositions;
}

export function aggregateComplexCryptoPositions(
  cryptoPositions: ICryptoBalance[],
) {
  const [_, pools] = partition(cryptoPositions, (token) =>
    isSimpleBalance(token),
  );
  const protocols: Record<string, Protocol> = {};
  const groups: Record<string, ProtocolGroup> = {};

  pools.forEach((pool) => {
    if (groups[pool.positionInfo!.groupId]) {
      groups[pool.positionInfo!.groupId]!.totalValueUSD +=
        (isDebt(pool) ? -1 : 1) * parseFloat(pool.balanceInUSD);
      groups[pool.positionInfo!.groupId]!.positions.push(pool);
    } else {
      groups[pool.positionInfo!.groupId] = {
        id: pool.positionInfo!.id,
        name: pool.positionInfo!.group,
        totalValueUSD: isDebt(pool)
          ? -parseFloat(pool.balanceInUSD)
          : parseFloat(pool.balanceInUSD),
        positions: [pool],
      };
    }
  });

  Object.values(groups).forEach((group) => {
    const key = group.positions[0]!.positionInfo!;
    if (protocols[key.protocolId]) {
      protocols[key.protocolId]!.totalValueUSD += group.totalValueUSD;
      protocols[key.protocolId]!.groups.push(group);
    } else {
      protocols[key.protocolId] = {
        name: key.protocol,
        imageUrl: key.protocolImageUrl ?? '',
        link: key.protocolLink ?? '',
        totalValueUSD: group.totalValueUSD,
        groups: [group],
      };
    }
  });

  return Object.values(protocols).sort(
    (p0, p1) => p1.totalValueUSD - p0.totalValueUSD,
  );
}
