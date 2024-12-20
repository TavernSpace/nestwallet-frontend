export enum PriorityLevel {
  MIN = 'Min',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  VERY_HIGH = 'VeryHigh',
  UNSAFE_MAX = 'UnsafeMax',
  DEFAULT = 'Default',
}

export enum UiTransactionEncoding {
  Binary = 'Binary',
  Base64 = 'Base64',
  Base58 = 'Base58',
  Json = 'Json',
  JsonParsed = 'JsonParsed',
}

export interface GetPriorityFeeEstimateOptions {
  priorityLevel?: PriorityLevel;
  includeAllPriorityFeeLevels?: boolean;
  transactionEncoding?: UiTransactionEncoding;
  lookbackSlots?: number;
  recommended?: boolean;
}

export interface GetPriorityFeeEstimateRequest {
  transaction?: string;
  accountKeys?: string[];
  options?: GetPriorityFeeEstimateOptions;
}

export interface GetRecentPrioritizationFeesRequest {
  accountKeys: string[];
  percentile: number;
}

export type GetRecentPrioritizationFeesResponse = {
  prioritizationFee: number;
  slot: number;
}[];

export interface MicroLamportPriorityFeeLevels {
  none: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
}

export interface GetPriorityFeeEstimateResponse {
  priorityFeeEstimate?: number;
  priorityFeeLevels?: MicroLamportPriorityFeeLevels;
}

export interface CompressionData {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}

export interface OwnershipData {
  delegate: string;
  delegated: boolean;
  frozen: boolean;
  owner: string;
  ownership_mode: string;
}

export interface CompressedNftTreeData {
  root: string;
  proof: string[];
  node_index: number;
  leaf: string;
  tree_id: string;
}
