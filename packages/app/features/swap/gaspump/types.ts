import { ICryptoBalance } from '../../../graphql/client/generated/graphql';

interface UserInfo {
  telegram_id: number | null;
  name: string | null;
  image_url: string | null;
  telegram_username: string | null;
  wallet_address: string | null;
}

export interface GasPumpTokenMetadata {
  name: string;
  ticker: string;
  token_address: string;
  image_url: string;
  user_info: UserInfo;
  contract_version: number;
  status: string | null;
  sticker_pack_url: string | null;
  is_full: boolean | null;
  market_cap: string | null;
  pool_address: string | null;
  unwrapped_jetton_master_address: string | null;
  dedust_whitelist_request_sent: boolean | null;
  tg_channel_link: string | null;
  tg_chat_link: string | null;
  twitter_link: string | null;
  website_link: string | null;
  description: string | null;
  unwrap_deadline_at: string | null;
  deployed_at: string | null;
  liquidity_progress: number | null;
  community_notes_count: number;
}

export interface GasPumpRoutesInput {
  mode: 'buy' | 'sell';
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  amount: string;
}

export interface GasPumpRoute {
  txType: 'buy' | 'sell' | 'unwrap'; //TODO: unwrap functionality
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  tokenMetadata: GasPumpTokenMetadata;
}
