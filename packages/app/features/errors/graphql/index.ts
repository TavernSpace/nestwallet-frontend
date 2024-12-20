import { Nullable } from "../../../common/types";
import { isJSONString } from "../../../common/utils/functions";
import { AppError } from "../types";
import { GraphqlErrors, ValidationError } from "./types";
import { getErrorElement } from "./validation-error";

export function tryParseGraphqlError(err: unknown, defaultError: string): AppError | undefined {
  if (isGraphQLErrors(err)) {
    const gqlError = err;
    if (gqlError.graphQLErrors[0]) {
      if (!isJSONString(gqlError.graphQLErrors[0].message)) {
        return new AppError(gqlError.graphQLErrors[0].message);
      }
      const serverErr = JSON.parse(gqlError.graphQLErrors[0].message);
      switch (serverErr.type) {
        case 'validationError':
          return getErrorsFromValidationError(serverErr, defaultError);
      }
    }
  }
  return undefined;
}

function isGraphQLErrors(error: unknown): error is GraphqlErrors {
  return typeof error === 'object' && !!(error as any)?.graphQLErrors;
}

function getErrorsFromValidationError(
  error: ValidationError,
  defaultError: string,
): AppError {
  let errorMessage: Nullable<string> = undefined;
  const formikError: { [key: string]: Nullable<string> } = {};
  if (error.path) {
    formikError[error.path] = getErrorElement(error, defaultError);
  } else {
    errorMessage = getErrorElement(error, defaultError);
  }
  return new AppError(errorMessage ?? defaultError)
    .withFormikError(formikError)
    .withValidationError(error);
}
