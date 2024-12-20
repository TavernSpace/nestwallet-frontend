import { AppError } from '../types';

export class HTTPError extends AppError {
  readonly code;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export class AuthorizationError extends HTTPError {
  constructor(message: string) {
    super(401, message);
  }
}
