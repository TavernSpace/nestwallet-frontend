import { AppError } from '../types';

export function tryParseEthersError(err: unknown): AppError | undefined {
  if (isEthersError(err)) {
    return new AppError(err.shortMessage);
  } else if (isNestedEthersError(err)) {
    return new AppError(err.error.message);
  } else if (isInfoEthersError(err)) {
    return new AppError(err.info.error.message);
  }
  return undefined;
}

function isNestedEthersError(
  error: unknown,
): error is { error: { message: string } } {
  return (
    typeof error === 'object' &&
    !!error &&
    'error' in error &&
    typeof error.error === 'object' &&
    !!error.error &&
    'message' in error.error &&
    typeof error.error.message === 'string'
  );
}

function isInfoEthersError(
  error: unknown,
): error is { info: { error: { message: string } } } {
  return (
    typeof error === 'object' &&
    !!error &&
    'info' in error &&
    typeof error.info === 'object' &&
    !!error.info &&
    'error' in error.info &&
    typeof error.info.error === 'object' &&
    !!error.info.error &&
    'message' in error.info.error &&
    typeof error.info.error.message === 'string'
  );
}

function isEthersError(error: unknown): error is { shortMessage: string } {
  return (
    typeof error === 'object' &&
    !!error &&
    'shortMessage' in error &&
    typeof error.shortMessage === 'string'
  );
}
