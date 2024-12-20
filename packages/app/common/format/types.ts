export enum NumberType {
  // used for token quantities in non-transaction contexts (e.g. portfolio balances)
  TokenNonTx = 'token-non-tx',
  // used for token quantities in transaction contexts
  TokenTx = 'token-tx',
  // used in the swap screens, needed for when exact amounts are needed
  TokenExact = 'token-exact',

  // fiat prices everywhere except Token Details flow
  FiatTokenPrice = 'fiat-token-price',
  FiatTokenExactPrice = 'fiat-token-exact-price',

  Percentage = 'percentage',
  Shorthand = 'shorthand',
}
export type FiatNumberType = Extract<NumberType, NumberType.FiatTokenPrice>;
