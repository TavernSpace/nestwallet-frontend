import { AppError } from '../types';

export function tryParseWalletConnectError(err: any): AppError | undefined {
  if (typeof err !== 'object') return;

  const message = err.message ?? '';
  if (
    message ===
    'Expired. pair() URI has expired. Please try again with a new connection URI.'
  ) {
    return new AppError(
      'WalletConnect QR code has expired. Please try again with a new QR code',
    );
  } else if (
    typeof message === 'string' &&
    message.startsWith('Pairing already exists:')
  ) {
    return new AppError(
      'A pairing with this QR code already exists. Please try again with a new QR code',
    );
  } else if (typeof message === 'string' && message !== '') {
    return new AppError(message);
  }

  return undefined;
}
