import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { SafeTransactionProposalWithNonce } from '../../../common/types';
import {
  IEthKeyTransactionProposal,
  ISafeMessageProposal,
} from '../../../graphql/client/generated/graphql';

export enum TrezorAction {
  SafeTxSign,
  SafeMessageSign,
  SafeTxExecute,
  EthKeyMessageSign,
  EthKeyTxExecute,
}

export interface TrezorSignSafeMessageRequest {
  type: TrezorAction.SafeMessageSign;
  proposal: ISafeMessageProposal;
}

export interface TrezorSignSafeTransactionRequest {
  type: TrezorAction.SafeTxSign;
  proposal: SafeTransactionProposalWithNonce;
}

export interface TrezorExecuteSafeTransactionRequest {
  type: TrezorAction.SafeTxExecute;
  proposal: SafeTransactionProposalWithNonce;
  transactionOptions: TransactionOptions;
}

export interface TrezorExecuteETHKeyTransactionRequest {
  type: TrezorAction.EthKeyTxExecute;
  proposal: IEthKeyTransactionProposal;
  transactionOptions: TransactionOptions;
  replacement: boolean;
}

export type TrezorRequest =
  | TrezorSignSafeMessageRequest
  | TrezorSignSafeTransactionRequest
  | TrezorExecuteSafeTransactionRequest
  | TrezorExecuteETHKeyTransactionRequest;
