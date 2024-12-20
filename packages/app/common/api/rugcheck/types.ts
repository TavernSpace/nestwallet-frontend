export interface RugCheckQueryInput {
  tokenAddress: string;
}

export interface RugCheckResponse {
  mint: string;
  tokenProgram: string;
  token: TokenDetails | null;
  token_extensions: any | null;
  tokenMeta: TokenMetadata | null;
  topHolders: TopHolder[] | null;
  freezeAuthority: null;
  mintAuthority: null;
  risks: Risk[] | null;
  score: number;
  fileMeta: FileMetadata | null;
  lockerOwners: any | null;
  lockers: any | null;
  lpLockers: any | null;
  markets: Market[] | null;
  rugged: boolean;
  tokenType: string;
  transferFee: TransferFee;
  knownAccounts: { [key: string]: KnownAccount } | null;
}

interface TokenDetails {
  mintAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  mutable: boolean;
  updateAuthority: string; // this is creator
}

export interface TopHolder {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
}

interface Risk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: string;
}

interface FileMetadata {
  description: string;
  name: string;
  symbol: string;
  image: string;
}

export interface Market {
  pubkey: string;
  marketType: string;
  mintA: string;
  mintB: string;
  mintLP: string;
  liquidityA: string;
  liquidityB: string;
  mintAAccount: MintAccount;
  mintBAccount: MintAccount;
  mintLPAccount: MintAccount;
  liquidityAAccount: LiquidityAccount;
  liquidityBAccount: LiquidityAccount;
  lp: LPDetails;
}

interface MintAccount {
  mintAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

interface LiquidityAccount {
  mint: string;
  owner: string;
  amount: number;
  delegate: string | null;
  state: number;
  delegatedAmount: number;
  closeAuthority: string | null;
}

interface LPDetails {
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  quotePrice: number;
  basePrice: number;
  base: number;
  quote: number;
  reserveSupply: number;
  currentSupply: number;
  quoteUSD: number;
  baseUSD: number;
  pctReserve: number;
  pctSupply: number;
  holders: TopHolder[];
  totalTokensUnlocked: number;
  tokenSupply: number;
  lpLocked: number;
  lpUnlocked: number;
  lpLockedPct: number;
  lpLockedUSD: number;
  lpMaxSupply: number;
  lpCurrentSupply: number;
  lpTotalSupply: number;
}

interface TransferFee {
  pct: number;
  maxAmount: number;
  authority: string;
}

interface KnownAccount {
  name: string;
  type: string;
}
