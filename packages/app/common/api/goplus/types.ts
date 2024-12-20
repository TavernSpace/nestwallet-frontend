export interface GoPlusInput {
  tokenAddress: string;
  chainId: string;
}

export interface EvmGoPlusResponse {
  token_name: string;
  token_symbol: string;
  holder_count: string;
  total_supply: string;
  holders?: Holder[];
  owner_balance: string;
  owner_percent: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  lp_total_supply: string;
  lp_holders: Holder[];
  is_true_token?: boolean;
  is_airdrop_scam?: boolean;
  trust_list?: string;
  other_potential_risks?: string;
  note?: string;
  fake_token?: { true_token_address: string; value: number };
  anti_whale_modifiable: string;
  buy_tax: string;
  can_take_back_ownership: string;
  cannot_buy: string;
  cannot_sell_all: string;
  dex: Dex[];
  external_call: string;
  hidden_owner: string;
  honeypot_with_same_creator: string;
  owner_change_balance: string;
  is_anti_whale: string;
  is_blacklisted: string;
  is_honeypot: string;
  is_in_dex: string;
  is_mintable: string;
  is_open_source: string;
  is_proxy: string;
  is_whitelisted: string;
  lp_holder_count: string;
  personal_slippage_modifiable: string;
  selfdestruct: string;
  sell_tax: string;
  slippage_modifiable: string;
  trading_cooldown: string;
  transfer_pausable: string;
}

export interface Holder {
  address: string;
  balance: string;
  percent: string;
  is_locked: number;
  tag: string;
  is_contract: number;
  locked_detail?: LockedDetail[];
}

export interface LockedDetail {
  amount: string;
  end_time: string;
  opt_time: string;
}

export interface Dex {
  liquidity_type: string;
  name: string;
  liquidity: string;
  pair: string;
}
