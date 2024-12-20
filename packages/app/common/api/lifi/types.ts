export interface LifiRoutesInput {
  fromAsset: string;
  fromChain: number;
  toAsset: string;
  toChain: number;
  // Integer string
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
  slippage: number;
  feePercent: number;
}

export interface LifiTokensInput {
  chains: number[];
}

export interface LifiStatusInput {
  txHash: string;
  fromChain: number;
  toChain: number;
}

export interface LifiToken {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  priceUSD: string;
}

interface FeeCost {
  name: string;
  description: string;
  percentage: string;
  token: LifiToken;
  amount: string;
  amountUSD: string;
  included: boolean;
}

interface GasCost {
  type: 'SUM' | 'APPROVE' | 'SEND' | 'FEE';
  price: string;
  estimate: string;
  limit: string;
  amount: string;
  amountUSD: string;
  token: LifiToken;
}

interface Estimate {
  tool: string;
  fromAmount: string;
  fromAmountUSD?: string;
  toAmount: string;
  toAmountMin: string;
  toAmountUSD?: string;
  approvalAddress: string;
  feeCosts?: FeeCost[];
  gasCosts?: GasCost[];
  executionDuration: number;
}

type StepType = 'lifi' | 'swap' | 'cross' | 'protocol' | 'custom';

interface Tool {
  key: string;
  name: string;
  logoURI: string;
}

interface DestinationCallInfo {
  toContractAddress: string;
  toContractCallData: string;
  toFallbackAddress: string;
  callDataGasLimit: string;
}

interface Action {
  fromChainId: number;
  fromAmount: string;
  fromToken: LifiToken;
  fromAddress?: string;
  toChainId: number;
  toToken: LifiToken;
  toAddress?: string;
  slippage: number;
}

type CallAction = Action & DestinationCallInfo;

export type ExecutionStatus =
  | 'NOT_STARTED'
  | 'STARTED'
  | 'ACTION_REQUIRED'
  | 'CHAIN_SWITCH_REQUIRED'
  | 'PENDING'
  | 'FAILED'
  | 'DONE'
  | 'RESUME'
  | 'CANCELLED';

interface Execution {
  status: ExecutionStatus;
  fromAmount?: string;
  toAmount?: string;
  toToken?: LifiToken;
  gasPrice?: string;
  gasUsed?: string;
  gasToken?: LifiToken;
  gasAmount?: string;
  gasAmountUSD?: string;
}

interface TxRequest {
  to: string;
  data: string;
  value: string;
}

interface StepBase {
  id: string;
  type: StepType;
  tool: string;
  toolDetails: Tool;
  integrator?: string;
  referrer?: string;
  action: Action;
  estimate?: Estimate;
  execution?: Execution;
  transactionRequest?: TxRequest;
}

interface SwapStep extends StepBase {
  type: 'swap';
  action: Action;
  estimate: Estimate;
}

interface CrossStep extends StepBase {
  type: 'cross';
  action: Action;
  estimate: Estimate;
}

interface ProtocolStep extends StepBase {
  type: 'protocol';
  action: Action;
  estimate: Estimate;
}

interface CustomStep extends StepBase {
  type: 'custom';
  action: CallAction;
  estimate: Estimate;
}

type Step = SwapStep | CrossStep | CustomStep | ProtocolStep;

export interface LifiStep extends Omit<Step, 'type'> {
  type: 'lifi';
  includedSteps: Step[];
}

export type LifiOrder = 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'SAFEST';

export interface LifiRoute {
  id: string;
  fromChainId: number;
  fromAmountUSD: string;
  fromAmount: string;
  fromToken: LifiToken;
  fromAddress?: string;
  toChainId: number;
  toAmountUSD: string;
  toAmount: string;
  toAmountMin: string;
  toToken: LifiToken;
  toAddress?: string;
  gasCostUSD?: string;
  containsSwitchChain?: boolean;
  infiniteApproval?: boolean;
  steps: LifiStep[];
  tags?: LifiOrder[];
}

export interface LifiRouteInput {
  fromChainId: number;
  fromTokenAddress: string;
  fromAddress: string;
  fromAmount: string;
  toChainId: number;
  toTokenAddress: string;
  toAddress: string;
  options: {
    order: string;
    slippage: number;
    allowSwitchChain: boolean;
    integrator?: string;
    maxPriceImpact: number;
    fee?: number;
    referrer?: string;
    exchanges: {
      deny: string[];
    };
  };
}

export type LifiStatus =
  | 'NOT_FOUND'
  | 'INVALID'
  | 'PENDING'
  | 'DONE'
  | 'FAILED';
export type LifiSubStatus =
  | 'WAIT_SOURCE_CONFIRMATIONS'
  | 'WAIT_DESTINATION_TRANSACTION'
  | 'BRIDGE_NOT_AVAILABLE'
  | 'CHAIN_NOT_AVAILABLE'
  | 'NOT_PROCESSABLE_REFUND_NEEDED'
  | 'REFUND_IN_PROGRESS'
  | 'UNKNOWN_ERROR'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'REFUNDED';

export interface LifiRoutesResponse {
  routes: LifiRoute[];
}

export type LifiQuoteResponse = Required<StepBase> | null;

export type LifiStepTransactionInput = LifiStep;

export type LifiStepTransactionResponse = LifiStep;

export interface LifiTokensResponse {
  tokens: Record<string, LifiToken[]>;
}

export interface LifiStatusResponse {
  status: LifiStatus;
  substatus?: LifiSubStatus;
  substatusMessage?: string;
}
