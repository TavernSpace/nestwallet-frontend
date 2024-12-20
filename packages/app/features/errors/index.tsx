import { tryParseEthersError } from './ethers';
import { tryParseGraphqlError } from './graphql';
import { tryParseHTTPError } from './http';
import { tryParseLedgerError } from './ledger/errors';
import { tryParseSvmError } from './svm';
import { AppError } from './types';
import { tryParseViemError } from './viem';

export function parseError(
  err: unknown,
  defaultError: string = 'Oops. There is an unexpected problem',
): AppError {
  return (
    tryParseHTTPError(err) ||
    tryParseGraphqlError(err, defaultError) ||
    tryParseViemError(err) ||
    tryParseEthersError(err) ||
    tryParseLedgerError(err) ||
    tryParseSvmError(err) ||
    tryParseGenericError(err) ||
    new AppError(defaultError)
  );
}

function tryParseGenericError(err: unknown): AppError | undefined {
  if (
    typeof err === 'object' &&
    err &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    return new AppError(err.message);
  }
  return undefined;
}
