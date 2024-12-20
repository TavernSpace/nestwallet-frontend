import { BaseError } from 'viem';
import { AppError } from '../types';

export function tryParseViemError(err: unknown): AppError | undefined {
  if (isViemError(err)) {
    return new AppError(err.shortMessage);
  }
  return undefined;
}

function isViemError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}
