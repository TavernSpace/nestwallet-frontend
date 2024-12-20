import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { useFormik } from 'formik';
import { Loadable, TransactionParams } from '../../common/types';
import { GasPriceLevel } from '../../features/proposal/types';
import { ISwapAssetInput, SwapRoute } from '../../features/swap/types';
import {
  ICryptoBalance,
  ISwapType,
  ITransactionMetadataInput,
  ITransactionProposal,
} from '../../graphql/client/generated/graphql';

export type QuickTradeMode = 'buy' | 'sell';

export interface BasicTokenInfo {
  address: string;
  chainId: number;
  price?: string;
  symbol: string;
  decimals: number;
  name: string;
  logo?: string;
}

export type QuickTradeApprovalTransactionMetadata = {
  type: 'approval';
  isApproval: boolean;
  token: ICryptoBalance;
};

export type QuickTradeSwapTransactionMetadata = {
  type: 'spot';
  mode: QuickTradeMode;
  fromToken: ICryptoBalance;
  fromAmount: string;
  toToken: ICryptoBalance;
  toAmount: string;
};

export type QuickTradeLimitTransactionMetadata = {
  type: 'limit';
  mode: QuickTradeMode;
  fromToken: ICryptoBalance;
  fromAmount: string;
  toToken: ICryptoBalance;
  targetPrice: string;
};

export type QuickTradeTransactionMetadata =
  | QuickTradeApprovalTransactionMetadata
  | QuickTradeSwapTransactionMetadata
  | QuickTradeLimitTransactionMetadata;

export interface QuickTradeProposalData {
  proposal: ITransactionProposal;
  metadata: QuickTradeTransactionMetadata;
}

export interface LedgerSigningSheetData {
  needApproval: boolean;
  approvalAddress: string;
}

export type CustomGasLevelMap = Record<
  number,
  {
    index?: number;
    level?: GasPriceLevel;
  }
>;

export type SlippageMap = Record<number, number>;

export interface ILimitOrderInput {
  targetPrice: string;
  marketPrice?: string;
  amount: string;
  fromAsset?: ICryptoBalance;
  toAsset?: ICryptoBalance;
  slippage: number;
  chainId: number;
  fee: number;
  infiniteApproval: boolean;
  disabled: boolean;
  expiration?: number;
}

export type SpotForm = Omit<
  ReturnType<typeof useFormik<ISwapAssetInput>>,
  'submitForm'
>;

export type LimitForm = Omit<
  ReturnType<typeof useFormik<ILimitOrderInput>>,
  'submitForm'
>;

export type SpotSubmit = (
  transactions: TransactionParams[],
  options: TransactionOptions[],
  tradeMetadata: QuickTradeTransactionMetadata[],
  amount: string,
  fromAsset: ICryptoBalance,
  fee: number,
  metadata: ITransactionMetadataInput[],
  mev: boolean,
  simulate: boolean,
  estimateCU?: boolean,
  computePrice?: bigint | boolean,
  onApprove?: VoidFunction,
  tip?: bigint,
) => Promise<void>;

export type LimitSubmit = (
  input: ILimitOrderInput,
  transaction: TransactionParams,
  tradeMetadata: QuickTradeLimitTransactionMetadata,
  metadata: ITransactionMetadataInput,
) => Promise<void>;

export type SafeSpotSubmit = (
  spotForm: SpotForm,
  route: Loadable<SwapRoute | null>,
  swapType: ISwapType,
) => Promise<void>;

export type TradeAction = 'spot' | 'limit';
