import type {
  AuthenticatorAttestationResponseJSON,
  Base64URLString,
} from '@simplewebauthn/typescript-types';

export interface RegistrationResponseJSON {
  id: Base64URLString;
  rawId: Base64URLString;
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputsJSON;
  type: PublicKeyCredentialType;
}

// - largeBlob extension: https://w3c.github.io/webauthn/#sctn-large-blob-extension
export interface AuthenticationExtensionsClientOutputsJSON {
  largeBlob?: AuthenticationExtensionsLargeBlobOutputs;
}

// Specification reference: https://w3c.github.io/webauthn/#dictdef-authenticationextensionslargebloboutputs
export interface AuthenticationExtensionsLargeBlobOutputs {
  // - true if, and only if, the created credential supports storing large blobs. Only present in registration outputs.
  supported?: boolean;
  // - The opaque byte string that was associated with the credential identified by rawId. Only valid if read was true.
  blob?: Base64URLString;
  // - A boolean that indicates that the contents of write were successfully stored on the authenticator, associated with the specified credential.
  written?: boolean;
}

export interface LargeBlobData {
  backupKek: string;
}
