import { AppError } from '../types';
import { HTTPError } from './types';

export function tryParseHTTPError(error: unknown): AppError | undefined {
  if (error instanceof HTTPError) {
    return error;
  }
  return undefined;
}
