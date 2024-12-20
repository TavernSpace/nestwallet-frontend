import { Nullable } from '../../common/types';
import { ValidationError } from './graphql/types';

export class AppError extends Error {
  formikError: { [key: string]: Nullable<string> };
  validationError: Nullable<ValidationError>;

  constructor(message: string) {
    super(message);
    this.formikError = {};
  }

  withFormikError(formikError: { [key: string]: Nullable<string> }): AppError {
    this.formikError = formikError;
    return this;
  }

  withValidationError(validationError: Nullable<ValidationError>): AppError {
    this.validationError = validationError;
    return this;
  }
}
