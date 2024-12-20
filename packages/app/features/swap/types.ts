import { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { DeDustRoute, DeDustToken } from '../../common/api/dedust/types';
import { JupiterRoute, JupiterToken } from '../../common/api/jupiter/types';
import {
  LifiQuoteResponse,
  LifiRoute,
  LifiToken,
} from '../../common/api/lifi/types';
import { RouterRoute } from '../../common/api/router/types';
import { StonFiRoute, StonFiToken } from '../../common/api/stonfi/types';
import { SwapCoffeeRoute } from '../../common/api/swap-coffee/types';
import { RecipientAccount, TransactionData, Tuple } from '../../common/types';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';
import { FourMemeRoute } from './fourmeme/types';
import { GasPumpRoute } from './gaspump/types';
import { MoonshotRoute } from './moonshot/types';
import { PumpFunRoute } from './pump-fun/types';

export type SwapMode = 'buy' | 'sell';

export interface SwapTransaction {
  data: TransactionData;
  chainId: number;
  type: TxActionType;
  bridgeMetadata?: BridgeMetadata;
  approvalAddress?: string;
}

export interface BridgeMetadata {
  bridgeId: string;
  chainId: number;
  expectedRecipientAddress: string;
  expectedTokenAddress: string;
  expectedTokenAmount: string;
}

export type SwapPresets = Record<
  string,
  { absolute?: Tuple<string, 3>; percentage?: Tuple<number, 3> }
>;

export type PresetInput = {
  address: string;
  chainId: number;
  presets?: Tuple<string, 3>;
  percentagePresets?: Tuple<number, 3>;
};

export interface SwapToken {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  priceUSD: string;
}

export interface SwapRoute {
  data: {
    id: string;
    fromChainId: number;
    fromAmountUSD: string;
    fromAmount: string;
    fromToken: SwapToken;
    fromAddress?: string;
    toChainId: number;
    toAmountUSD: string;
    toAmount: string;
    toAmountMin: string;
    toToken: SwapToken;
    toAddress?: string;
    gasCostUSD?: string;
  };
  jupiter?: JupiterRoute;
  lifiRoute?: LifiRoute;
  lifiQuote?: LifiQuoteResponse;
  pumpfun?: PumpFunRoute;
  moonshot?: MoonshotRoute;
  stonfi?: StonFiRoute;
  dedust?: DeDustRoute;
  gasPump?: GasPumpRoute;
  fourMeme?: FourMemeRoute;
  router?: RouterRoute;
  swapCoffee?: SwapCoffeeRoute;
}

export type TxActionType = 'approve' | 'swap' | 'bridge';

export type RouteValue = { routeValue: number; feeCost: number };

export interface ISwapAssetInput {
  fromChainId: number;
  toChainId: number;
  fromAsset?: ICryptoBalance;
  toAsset?: ICryptoBalance;
  toAccount?: RecipientAccount;
  amount: string;
  description: string;
  slippage: number;
  infiniteApproval: boolean;
  simulate: boolean;
  relay?: boolean;
  fee: number;
  disabled: boolean;
}

export interface IQuickTradeAssetInput {
  chainId: number;
  fromAsset?: ICryptoBalance;
  toAsset?: ICryptoBalance;
  amount: string;
  slippage: number;
}

export type SvmTokenType = 'pumpfun' | 'moonshot' | 'jupiter';

export type SwappableTokens = Record<number, ICryptoBalance[]>;

export type useQueryHookSignature<TVariable, TData, TError> = (
  variables: TVariable,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey'>,
) => UseQueryResult<TData, TError>;

export type ExternalSwapToken =
  | JupiterToken
  | LifiToken
  | StonFiToken
  | DeDustToken;
