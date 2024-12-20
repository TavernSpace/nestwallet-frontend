import { AppError } from '../types';

// Sometimes errors look like this:
// { InstructionError: [ 4, { Custom: 1 } ] }
export function tryParseSvmError(err: any): AppError | undefined {
  if (typeof err !== 'object') return;

  const message = err.message ?? '';
  if (
    typeof message === 'string' &&
    message.includes('Transaction simulation failed') &&
    message.includes('custom program error: 0x1')
  ) {
    return new AppError(
      'Transaction simulation failed: Insufficient funds for transaction',
    );
  } else if (
    typeof message === 'string' &&
    message.includes('Transaction simulation failed') &&
    message.includes('custom program error: 0x1771')
  ) {
    return new AppError(
      'Transaction simulation failed: Slippage tolerance exceeded',
    );
  } else if (
    err.InstructionError &&
    Array.isArray(err.InstructionError) &&
    err.InstructionError.length === 2 &&
    typeof err.InstructionError[0] === 'number' &&
    typeof err.InstructionError[1] === 'object' &&
    err.InstructionError[1].Custom &&
    err.InstructionError[1].Custom === parseInt('1', 16)
  ) {
    return new AppError(
      'Transaction simulation failed: Insufficient funds for transaction',
    );
  } else if (
    err.InstructionError &&
    Array.isArray(err.InstructionError) &&
    err.InstructionError.length === 2 &&
    typeof err.InstructionError[0] === 'number' &&
    typeof err.InstructionError[1] === 'object' &&
    err.InstructionError[1].Custom &&
    err.InstructionError[1].Custom === parseInt('1771', 16)
  ) {
    return new AppError(
      'Transaction simulation failed: Slippage tolerance exceeded',
    );
  }

  return undefined;
}
