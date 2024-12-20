import type { SafeInfoResponse } from '@safe-global/api-kit';
import type { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import type { ConnectItem } from '@tonconnect/protocol';
import type { IWalletInfo } from '../../features/wallet/service/interface';
import type {
  IBlockchainType,
  IBridgeData,
  IBridgeStatus,
  IContact,
  IContractVisibility,
  ICryptoBalance,
  IMessageType,
  INftBalance,
  INftCollectionMetadata,
  ISafeMessageProposal,
  ISafeTransactionProposal,
  ITokenMetadata,
  ITransactionBridgeMetadata,
  ITransactionProposal,
  IWallet,
  IWalletType,
  Maybe,
} from '../../graphql/client/generated/graphql';

export enum LedgerPathType {
  LedgerLiveEvm = 'Ledger Live (ETH)',
  DefaultEvm = 'Default (ETH)',
  DefaultSvm = 'Default (SOL)',
  DefaultTvm = 'Default (TON)',
}

export type Origin = {
  url?: string;
  title?: string;
  favIconUrl?: string;
};

export interface Account {
  blockchain: IBlockchainType;
  address: string;
  balance?: string;
  derivationPath: string;
  derivationIndex: number;
}

export interface RecipientAccount {
  address: string;
  name?: string;
  contact?: IContact;
  wallet?: IWallet;
  interactions?: number;
}

export interface UserData {
  userId: string;
  email?: string;
  name?: string;
  accessToken: string;
  expireAt: string;
}

export interface Preferences {
  profitLoss: 'daily' | 'pnl';
  stealthMode: boolean;
  audioMuted: boolean;
  showTransactionWidget: boolean;
}

export type CustomGasSettings = Record<
  number,
  {
    custom?: string;
    index?: number;
  }
>;

export interface TradeSettings {
  slippage: Record<number, number>;
  defaultSecondaryAsset: Record<number, string>;
  customGas: CustomGasSettings;
  tip: string | null;
  mev: boolean;
  infiniteApproval: boolean;
  simulate: boolean;
}

export interface TokenDetailSettings {
  chartType: 'line' | 'candle';
}

export type TransactionData = {
  to: string;
  value: string;
  data: string;
};

export type TransactionParams = TransactionData & {
  chainId: number;
  from: string;
};

type KeyTypeProposal = NonNullable<
  {
    [K in keyof ITransactionProposal]: K extends `${string}Key` ? K : never;
  }[keyof ITransactionProposal]
>;

export type ExternalTransactionProposal = NonNullable<
  ITransactionProposal[KeyTypeProposal]
>;

export type SeedPhrase = string[];

export type SeedPhraseInput = {
  words: SeedPhrase;
};

export interface IKeyring {
  type: IWalletType.SeedPhrase | IWalletType.PrivateKey;
  blockchain: IBlockchainType;
  keyringIdentifier: string;
  value: string;
}

export interface IHardwareKeyring {
  type: IWalletType.Ledger | IWalletType.Trezor;
  keyringIdentifier: string;
  value: string;
}

export interface IKeyringMetadata {
  type: IWalletType.SeedPhrase | IWalletType.PrivateKey;
  blockchain: IBlockchainType;
  keyringIdentifier: string;
}

export type KeyringsMetadata = Record<string, IKeyringMetadata>;

export interface IPersonalWallet {
  type: IWalletType;
  address: string;
  keyringIdentifier: string;
  derivationPath?: string;
}

export type IDappData = {
  requestId: string;
  tabId?: number | undefined;
  isInternal?: boolean;
};

export interface IApproveInput {
  requestId: string;
  tabId?: number;
  windowId?: number;
  origin: Origin;
  blockchain: IBlockchainType;
}

export interface IApproveConnectionInput extends IApproveInput {
  chainId: number;
  items?: ConnectItem[];
  manifest?: {
    name: string;
    url: string;
  };
}
export interface IApproveSwitchChainInput extends IApproveInput {
  chainId: number;
}

export interface IApproveTransactionInput extends IApproveInput {
  walletAddress: string;
  txs: string[];
}

export interface IApproveMessageInput extends IApproveInput {
  type: IMessageType;
  walletAddress: string;
  message: string;
  chainId: number;
}

export interface IApprovalResponse<TResult = unknown, TError = unknown> {
  requestId: string;
  blockchain: IBlockchainType;
  tabId?: number;
  result?: TResult;
  error?: TError;
}

export interface WalletLike {
  name: string;
  address: string;
}

export interface ISignerWallet extends IWallet {
  hasKeyring: boolean;
}

export interface WalletWithSafeInfo {
  wallet: IWallet;
  safeInfo: SafeInfoResponse;
}

export interface CollectionWithPermissions {
  collection: INftCollectionMetadata;
  chainId: number;
  nfts: number;
  visibility?: Maybe<IContractVisibility>;
}

export interface SafeNonceData {
  latestNonce: number;
  nonces: number[];
}

export interface SafeTransactionProposalWithNonce
  extends ISafeTransactionProposal {
  safeNonce: number;
}

export interface SigningParams {
  proposalId: string;
  walletId: string;
}

export interface ExecutionParams {
  proposalId: string;
  walletId: string;
  options: TransactionOptions;
}

export interface IWalletWithLoadableBalance {
  wallet: ISignerWallet;
  balance: Loadable<string>;
}

export interface AssetTransfer {
  asset: ICryptoBalance | INftBalance;
  value: string;
  fiatValue?: string;
  comment?: string;
  wrapSol?: boolean;
  recipient: string;
}

export type BridgeData =
  | {
      legacy: true;
      bridgeStatus: IBridgeStatus;
      bridgeData: IBridgeData;
    }
  | {
      legacy: false;
      bridgeStatus: IBridgeStatus;
      bridgeData: ITransactionBridgeMetadata;
    };

export type SignatureType = 'message' | 'transaction';

export type Resolution = '1s' | '1' | '5' | '15' | '60' | '1D' | '7D';

export interface BasicFeeData {
  units: Tuple<bigint, 3>;
  token: ITokenMetadata;
  additionalDecimals: number;
}

export type TaggedSafeProposal =
  | {
      type: 'message';
      proposal: ISafeMessageProposal;
    }
  | {
      type: 'transaction';
      proposal: ISafeTransactionProposal;
    };

export type Loadable<TData extends DefinedType> =
  | {
      data: TData;
      loading: false;
      error: false;
      success: true;
    }
  | {
      data: undefined;
      loading: true;
      error: false;
      success: false;
    }
  | {
      data: undefined;
      loading: false;
      error: true;
      success: false;
    };

export type DefinedType = {} | null;

export type Defined<T> = T extends DefinedType ? T : never;

export type Nullable<T> = T | null | undefined;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

export type PromiseFunction<T> = () => Promise<T>;

export type VoidPromiseFunction = PromiseFunction<void>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type LoadField<T, K extends keyof T> = T[K] extends Loadable<infer D>
  ? Omit<T, K> & { [Key in K]: D }
  : T;

export type ReplaceField<T, K extends keyof T, N> = Omit<T, K> & {
  [Key in K]: N;
};

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

export type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export interface SiteInfo {
  url: string;
  origin: string;
  title: string;
  imageUrl: string;
}

export interface ConnectionData {
  connections: Partial<
    Record<IBlockchainType, { wallet: IWalletInfo; chainId: number }>
  >;
  title: string;
  imageUrl: string;
}

export interface ConnectedSitesData {
  [origin: string]: ConnectionData;
}

export type ConnectedSite = {
  connections: Partial<
    Record<
      IBlockchainType,
      {
        wallet: IWalletInfo;
        chainId: number;
      }
    >
  >;
  siteInfo?: SiteInfo;
};
