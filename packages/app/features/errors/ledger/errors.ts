import {
  DisconnectedDevice,
  EthAppPleaseEnableContractData,
  LockedDeviceError,
  TransportOpenUserCancelled,
} from '@ledgerhq/errors';
import { StatusCodes } from '@ledgerhq/hw-transport';
import { AppError } from '../types';
import { LedgerError, LedgerErrorCode } from './types';

export function tryParseLedgerError(err: any): AppError | undefined {
  if (typeof err !== 'object') return;
  const statusCode = err.statusCode as number | undefined;
  const message = err.message ?? '';
  const name = err.name ?? '';
  if (
    statusCode === StatusCodes.CLA_NOT_SUPPORTED ||
    statusCode === StatusCodes.UNKNOWN_APDU ||
    statusCode === StatusCodes.INS_NOT_SUPPORTED ||
    statusCode === 0x6511
  ) {
    return new LedgerError(
      `Please open the correct app on your Ledger and try again`,
      LedgerErrorCode.LedgerNotRunningEthApp,
    );
  } else if (
    err instanceof LockedDeviceError ||
    statusCode === StatusCodes.SECURITY_STATUS_NOT_SATISFIED
  ) {
    return new LedgerError(
      'Please unlock your Ledger and try again',
      LedgerErrorCode.LedgerIsLocked,
    );
  } else if (statusCode === StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED) {
    return new LedgerError(
      'User rejected the transaction',
      LedgerErrorCode.UserRejectedTransaction,
    );
  } else if (
    message.includes('Failed to open the device') ||
    err instanceof TransportOpenUserCancelled ||
    err instanceof DisconnectedDevice
  ) {
    return new LedgerError(
      'Please connect your Ledger',
      LedgerErrorCode.LedgerAccessDenied,
    );
  } else if (err instanceof EthAppPleaseEnableContractData) {
    return new LedgerError(
      'Please enable blind signing in your Ethereum app',
      LedgerErrorCode.LedgerBlindSignNotEnabled,
    );
  } else if (name === 'TransportStatusError') {
    // catch all for all transport status errors
    return new LedgerError(
      'Unknown error - please reconnect your Ledger',
      LedgerErrorCode.LedgerTransportError,
    );
  }
  return undefined;
}
