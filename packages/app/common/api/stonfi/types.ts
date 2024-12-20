export interface StonFiRoutesInput {
  offer_address: string;
  ask_address: string;
  units: string;
  slippage_tolerance: string;
  referral_address?: string;
}

export interface StonFiRoute {
  ask_address: string;
  ask_jetton_wallet: string;
  ask_units: string;
  fee_address: string;
  fee_percent: string;
  fee_units: string;
  min_ask_units: string;
  offer_address: string;
  offer_jetton_wallet: string;
  offer_units: string;
  pool_address: string;
  price_impact: string;
  router_address: string;
  slippage_tolerance: string;
  swap_rate: string;
}

export interface StonFiToken {
  balance: string;
  blacklisted: boolean;
  community: boolean;
  contract_address: string;
  decimals: number;
  default_symbol: boolean;
  deprecated: boolean;
  dex_price_usd?: string;
  dex_usd_price?: string;
  display_name: string;
  image_url: string;
  kind: 'Jetton' | 'wTon' | 'Ton';
  priority: number;
  symbol: string;
  tags: string[];
  taxable: boolean;
  third_party_price_usd: string;
  third_party_usd_price: string;
  wallet_address: string;
}

export interface StonFiAssetsResponse {
  asset_list: StonFiToken[];
}
