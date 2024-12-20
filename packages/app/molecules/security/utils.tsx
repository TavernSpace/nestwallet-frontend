import {
  faCheckCircle,
  faCircleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import { uniqBy } from 'lodash';
import {
  EvmGoPlusResponse,
  Holder as EvmTopHolder,
} from '../../common/api/goplus/types';
import {
  Market,
  TopHolder as SvmTopHolder,
} from '../../common/api/rugcheck/types';
import { colors } from '../../design/constants';
import { getChainInfo } from '../../features/chain';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';

export const getRiskScoreProperties = (score: number, strict = false) => ({
  color:
    (score <= 300 && !strict) || (score === 0 && strict)
      ? colors.success
      : score <= 600
      ? colors.warning
      : colors.failure,
  icon: score <= 300 ? faCheckCircle : faCircleExclamation,
});

export const getTopHoldersColor = (percentage: number) =>
  percentage > 30
    ? colors.failure
    : percentage >= 15 && percentage <= 30
    ? colors.warning
    : null;

export const calculateMarketCap = (
  averagePrice: number,
  totalSupply: number,
  decimals?: number,
) => {
  return decimals
    ? averagePrice * (totalSupply / Math.pow(10, decimals || 0))
    : averagePrice * totalSupply;
};

// svm specific
export const calculateSvmTopHoldersPercentage = (
  topHolders: SvmTopHolder[],
) => {
  const topHoldersSlice =
    topHolders.length > 5 ? topHolders.slice(0, 5) : topHolders;
  return topHoldersSlice.reduce((acc, holder) => acc + holder.pct, 0);
};

export const calculateSvmLpLockedPercentage = (markets: Market[] | null) => {
  if (!markets || !markets[0]?.lp?.lpLocked || !markets[0].lp.lpTotalSupply) {
    return 0;
  }
  return (markets[0].lp.lpLocked / markets[0].lp.lpTotalSupply) * 100;
};

export const calculateSvmAveragePrice = (
  markets: Market[] | null,
  tokenAddress: string,
) => {
  if (!markets) return 0;

  const prices = markets.map((market) => {
    if (market.lp.quoteMint === tokenAddress) {
      return market.lp.quotePrice;
    } else if (market.lp.baseMint === tokenAddress) {
      return market.lp.basePrice;
    }
    return 0;
  });

  return prices.length > 0
    ? prices.reduce((acc, price) => acc + price, 0) / prices.length
    : 0;
};

export const filterUniqueRisks = (risks: Risk[]) => {
  return uniqBy(risks, (risk) => risk.name);
};

//evm
export const calculateEvmTopHoldersPercentage = (
  topHolders: EvmTopHolder[],
) => {
  if (!topHolders || topHolders.length === 0) {
    return 0;
  }
  const topHoldersSlice =
    topHolders.length > 5 ? topHolders.slice(0, 5) : topHolders;
  return topHoldersSlice.reduce(
    (acc, holder) => acc + parseFloat(holder.percent) * 100,
    0,
  );
};

export const calculateEvmLpLockedPercentage = (lpHolders: EvmTopHolder[]) => {
  if (!lpHolders || lpHolders.length === 0) {
    return 0;
  }

  const lpLocked = lpHolders.reduce((acc, holder) => {
    if (holder.is_locked) {
      return acc + parseFloat(holder.balance);
    }
    return acc;
  }, 0);

  const totalSupply = lpHolders.reduce(
    (acc, holder) => acc + parseFloat(holder.balance),
    0,
  );

  return totalSupply ? (lpLocked / totalSupply) * 100 : 0;
};

export interface Risk {
  name: string;
  description: string;
  score: number;
}

export function generateRiskScoreAndFlags(
  topHolders: EvmTopHolder[],
  report: EvmGoPlusResponse,
): { score: number; flags: Risk[] } {
  let totalScore = 0;
  const flags: Risk[] = [];
  const isTrusted = report.trust_list === '1';

  const addRisk = (name: string, description: string, score: number) => {
    flags.push({ name, description, score });
    totalScore += score;
  };

  if (isTrusted) {
    addRisk('Trusted Token', 'This is token is well known and likely safe.', 0);
  }

  if (report.is_blacklisted === '1') {
    addRisk(
      'Blacklist Ability',
      'This token can blacklist addresses, preventing them from trading normally',
      100,
    );
  }

  if (report.is_honeypot === '1') {
    addRisk(
      'Honeypot Risk',
      'This token is identified as a honeypot, meaning it may prevent you from selling after purchase.',
      1000,
    );
  }

  if (report.is_airdrop_scam) {
    addRisk(
      'Airdrop Scam',
      'This token has been identified as part of an airdrop scam.',
      800,
    );
  }

  if (report.is_true_token === false || report.fake_token) {
    addRisk(
      'Fake Token',
      'This token is identified as fake. It does not match the true token contract.',
      900,
    );
  }

  if (parseFloat(report.buy_tax) > 0.05) {
    addRisk(
      'High Buy Tax',
      'This token has a high buy tax, which could reduce the profitability of trading.',
      300,
    );
  }

  if (parseFloat(report.sell_tax) > 0.05) {
    addRisk(
      'High Sell Tax',
      'This token has a high sell tax, which could reduce the profitability of trading.',
      300,
    );
  }

  if (report.hidden_owner === '1') {
    addRisk(
      'Hidden Owner',
      'The owner of this token is hidden, which could be a sign of malicious intent.',
      200,
    );
  }

  if (report.honeypot_with_same_creator === '1') {
    addRisk(
      'Honeypot Creator',
      'The creator of this token has previously created honeypot scams.',
      800,
    );
  }

  if (parseInt(report.holder_count) < 50) {
    addRisk(
      'Low Holder Count',
      'This token has a very low number of holders, which might indicate low trust or interest.',
      600,
    );
  }

  if (report.is_open_source === '0') {
    addRisk(
      'Closed-Source Contract',
      'This contract is closed-source, which may hide various unknown or malicious mechanisms.',
      200,
    );
  }

  if (report.is_proxy === '1') {
    addRisk(
      'Proxy Contract',
      `This contract is a proxy contract and can be modified by it's creators`,
      50,
    );
  }

  if (report.is_mintable === '1') {
    addRisk(
      'Mint Functionality',
      'This contract has the ability to mint tokens, which can trigger a massive sell-off, causing the coin price to plummet.',
      300,
    );
  }

  if (report.can_take_back_ownership === '1') {
    addRisk(
      'Can Take Back Ownership',
      'This contract has the ability to reclaim ownership, which may reactivate risky functionalities like minting, modifying slippage, or suspending trading.',
      300,
    );
  }

  if (report.owner_change_balance === '1') {
    addRisk(
      'Owner Can Change Balance',
      "This contract allows the owner to change token holder balances, which could result in a holder's asset being changed to 0 or a massive minting and sell-off.",
      1000,
    );
  }

  if (report.selfdestruct === '1') {
    addRisk(
      'Self-Destruct Function',
      'This contract has a self-destruct function, which, when triggered, will destroy the contract and erase all related assets.',
      1000,
    );
  }

  if (report.external_call === '1') {
    addRisk(
      'External Call Capability',
      'This contract can call functions in other contracts during execution, causing the implementation of this contract to be dependent on external contracts.',
      100,
    );
  }

  if (report.cannot_buy === '1') {
    addRisk(
      'Cannot Be Bought',
      'This token cannot be bought, indicating it may have special mechanisms or restrictions.',
      1000,
    );
  }

  if (report.cannot_sell_all === '1') {
    addRisk(
      'Cannot Sell All',
      'This contract restricts holders from selling all their tokens in a single transaction, which may limit liquidity.',
      1500,
    );
  }

  if (report.slippage_modifiable === '1') {
    addRisk(
      'Modifiable Tax',
      'This contract allows the trading tax to be modified, which may cause unexpected losses.',
      200,
    );
  }

  if (report.transfer_pausable === '1') {
    addRisk(
      'Pausable Transfer',
      'This contract allows trading to be paused at any time, which may prevent you from selling your tokens.',
      800,
    );
  }

  if (report.is_anti_whale === '1') {
    addRisk(
      'Anti-Whale Mechanism',
      'This contract has an anti-whale mechanism, which limits the maximum amount of transactions or the maximum token position for a single address.',
      100,
    );
  }

  if (report.anti_whale_modifiable === '1') {
    addRisk(
      'Modifiable Anti-Whale Mechanism',
      'This contract has a modifiable anti-whale mechanism, which may limit trading by setting very small transaction values.',
      100,
    );
  }

  if (report.trading_cooldown === '1') {
    addRisk(
      'Trading Cooldown',
      'This contract has a trading cooldown mechanism, which limits the minimum time between two transactions.',
      300,
    );
  }

  if (report.personal_slippage_modifiable === '1') {
    addRisk(
      'Modifiable Personal Slippage',
      'This contract allows the owner to set a different tax rate for every assigned address, which may block trading for specific addresses.',
      400,
    );
  }

  const topHoldersPercentage = calculateEvmTopHoldersPercentage(topHolders);
  if (topHoldersPercentage > 50) {
    addRisk(
      'High Holder Concentration',
      'The top holders hold more than 50% of the token supply',
      700,
    );
  }

  const singleHolderPercentage =
    parseFloat(topHolders[0]?.percent || '0') * 100;
  if (singleHolderPercentage > 30) {
    addRisk(
      'Single Holder Ownership',
      'One user holds a large amount of the token supply',
      700,
    );
  }

  flags.sort((a, b) => b.score - a.score);

  return { score: isTrusted ? 0 : totalScore, flags };
}

export function ignoreSecurityReport(token?: ICryptoBalance) {
  if (!token) return true;
  const chainInfo = getChainInfo(token.chainId);
  return (
    token.tokenMetadata.isNativeToken ||
    token.tokenMetadata.address === chainInfo.wrappedToken.address ||
    chainInfo.stablecoins.some((coin) => coin.address === token.address)
  );
}
