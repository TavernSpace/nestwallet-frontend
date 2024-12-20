import { AppError } from '../types';

export enum LedgerErrorCode {
  LedgerIsLocked = 'LedgerIsLocked',
  LedgerNotRunningEthApp = 'LedgerNotRunningEthApp',
  LedgerBlindSignNotEnabled = 'LedgerBlindSignNotEnabled',
  LedgerAccessDenied = 'LedgerAccessDenied',
  UserRejectedTransaction = 'UserRejectedTransaction',
  LedgerTransportError = 'LedgerTransportError',
}

export class LedgerError extends AppError {
  public code?: LedgerErrorCode;

  constructor(message: string, code?: LedgerErrorCode) {
    super(message);
    this.code = code;
  }
}
