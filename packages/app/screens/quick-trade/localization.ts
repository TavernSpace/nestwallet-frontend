export const localization = {
  // input.tsx
  selectTokenBuy: {
    en: 'Select Token to Buy',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  selectTokenSell: {
    en: 'Select Token to Sell',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  balance: (balance: string) => ({
    en: `Balance: ${balance}`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  from: {
    en: 'From',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  to: {
    en: 'To',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  selectToken: {
    en: 'Select Token',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },

  // mode.tsx
  buy: {
    en: 'Buy',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  sell: {
    en: 'Sell',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  limitBuy: {
    en: 'Buy',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  limitSell: {
    en: 'Sell',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },

  //proposals.tsx
  noTransactionsYet: {
    en: 'No Transactions Yet',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  noTransactionsYetDescription: {
    en: 'Any swaps done using Quick Trade will be shown here.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  approve: {
    en: 'Approve',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  unlimited: (token: string) => ({
    en: `Unlimited ${token}`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  executing: {
    en: 'Executing',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  executed: {
    en: 'Executed',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  placing: {
    en: 'Placing',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  placed: {
    en: 'Placed',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  failed: {
    en: 'Failed',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  dropped: {
    en: 'Dropped',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },

  // query.tsx
  insufficientTON: {
    en: 'Insufficient TON for transaction, minimum 0.3 required',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  insufficientGas: {
    en: 'Insufficient gas for transaction',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  couldNotDetermineSwapPlatform: {
    en: 'Could not determine Swap Platform used',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },

  // screen.tsx
  unableToStartTrade: {
    en: 'Unable to start Trade',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  tokenDataErrorTitle: {
    en: 'Unable to get Token Data',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  tokenDataErrorDescription: {
    en: `Something went wrong trying to get this token's data.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  errorGettingBalances: {
    en: 'Something went wrong trying to get your balances to trade',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },

  // summary.tsx
  tradeSummary: {
    en: 'Trade Summary',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  orderSummary: {
    en: 'Order Summary',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  rate: {
    en: 'Rate',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  receive: {
    en: 'Total Received',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  slippage: {
    en: 'Slippage',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  security: {
    en: 'Security',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  tip: {
    en: 'Tip',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  received: {
    en: 'Received Amount',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  receivedToken: {
    en: 'Received Token',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  orderGas: {
    en: 'Order Fee',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  order: {
    en: 'Order',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  expiration: {
    en: 'Expiration',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  mev: {
    en: 'MEV',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  priceImpactMedium: {
    en: 'Moderate Price Impact',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  priceImpactHigh: {
    en: 'High Price Impact',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  valueLossMedium: {
    en: 'Moderate Value Loss',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  valueLossTitle: {
    en: 'Value Loss',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  valueLossBody: (fromUsd: string, toUsd: string) => ({
    en: `There is a large difference between the value of the tokens you are sending (${fromUsd}) and the tokens you are receiving (${toUsd}); proceed with caution.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  valueLossHigh: {
    en: 'High Value Loss',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  lowLiquidity: {
    en: 'Low Liquidity',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  lowLiquidityBody: (fromUsd: string, toUsd: string) => ({
    en: `There is a large difference between the value of the tokens you are sending (${fromUsd}) and the tokens you are receiving (${toUsd}). This is usually due to one of the tokens having low liquidity; proceed with caution.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  orderFeeTitle: {
    en: 'Order Fee',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  orderFeeBody: {
    en: 'The fee which will be used to execute your limit order on chain.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  // utils.ts
  previousTransactionFailed: {
    en: 'A previous transaction has failed',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  previousTransactionDropped: {
    en: 'A previous transaction has dropped, try increasing your gas or tip and executing again',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  previousSvmTransactionFailed: (errorMsg: string) => ({
    en: `${errorMsg}`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
};
