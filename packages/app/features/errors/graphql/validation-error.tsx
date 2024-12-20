type ErrorCode = {
  domain: string;
  name: string;
};

type ValidationError = {
  type: 'validationError';
  code?: ErrorCode;
  path?: string;
  message?: string;
  params?: { [key: string]: any };
};

type ErrorHandler = (err: ValidationError) => string;
const validationErrorRegistry: { [key: string]: ErrorHandler } = {};

function registerValidationErrorHandler(key: string, handler: ErrorHandler) {
  validationErrorRegistry[key] = handler;
}

export function getErrorElement(err: ValidationError, defaultError: string) {
  const key = `${err.code?.domain}:${err.code?.name}`;
  const handler = validationErrorRegistry[key];
  if (handler) {
    return handler(err);
  }
  return err.message ?? defaultError;
}

registerValidationErrorHandler('common:required', () => {
  return 'This field is required.';
});

registerValidationErrorHandler('common:subscriptionRequired', () => {
  return 'subscriptionRequired';
});

registerValidationErrorHandler('account:emailAlreadyRegistered', () => {
  return 'The email address you entered is already in use.';
});

registerValidationErrorHandler('account:identityIsAlreadyLinked', () => {
  return 'The identity is already associated with another user.';
});

registerValidationErrorHandler('account:invalidConfirmToken', () => {
  return 'The confirmation link has expired. You can check your email for a new confirmation link, sign in to your already activated account, or create a new account.';
});

registerValidationErrorHandler('account:invalidCredentials', () => {
  return 'The password or one-time code you entered is invalid.';
});

registerValidationErrorHandler('account:invalidRecoverToken', () => {
  return 'The reset password link has expired. You can request a new reset password link';
});

registerValidationErrorHandler('account:invalidVerificationCode', () => {
  return 'The verification you entered is invalid.';
});

registerValidationErrorHandler(
  'account:userAccountAlreadyExistsUnderOrg',
  () => {
    return 'This user is already registered under the organization.';
  },
);

registerValidationErrorHandler('account:userIsNotRegistered', () => {
  return 'You have not signed up for Nest Wallet. Please sign up';
});

registerValidationErrorHandler('organization:identifierAlreadyExists', () => {
  return 'The identifier you entered is not available.';
});

registerValidationErrorHandler('organization:userEmailDoesNotExist', () => {
  return 'That email is not linked to a Nest Wallet account';
});

registerValidationErrorHandler('organization:duplicateUserAccountRole', () => {
  return 'That user is already an admin.';
});

registerValidationErrorHandler(
  'organization:canNotDeleteUserAccountOwner',
  () => {
    return 'Can not remove Owner role.';
  },
);

registerValidationErrorHandler('storage:invalidFileType', () => {
  return 'The file you uploaded is of invalid file type.';
});

registerValidationErrorHandler('storage:fileExceededMaxSize', () => {
  return 'The file you uploaded exceeded the maximum size.';
});

registerValidationErrorHandler('user:usernameAlreadyExists', () => {
  return 'The username you entered is not available.';
});

registerValidationErrorHandler('contact:alreadyExists', () => {
  return 'This address has already been added to your organization as a contact.';
});

registerValidationErrorHandler('contact:failChecksum', () => {
  return 'This address fails the checksum. Make sure you have the correct address (mixed-case).';
});

registerValidationErrorHandler('proposal:canNotDeleteSignedTransaction', () => {
  return 'Can not deleted transaction. Someone has already signed it.';
});
