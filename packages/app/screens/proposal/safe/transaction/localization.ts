import { Maybe } from '../../../../graphql/client/generated/graphql';

export const localization = {
  editNonce: {
    en: 'Edit Nonce',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  nextExecutableNonce: (nonce: number) => ({
    en: `The next executable nonce is ${nonce}.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  previousExecutedNonce: (nonce: number) => ({
    en: `The previous executed transaction had nonce ${nonce}.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  lastPendingNonce: (nonce: number) => ({
    en: `The last pending transaction has nonce ${nonce}.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  NONCE: {
    en: 'NONCE',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  noncePlaceholder: {
    en: 'Edit nonce for this transaction',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  onChainRejectionForNonce: (nonce: Maybe<number> | undefined) => ({
    en: `On-chain rejection for nonce ${nonce}`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  viewTransaction: {
    en: 'View Transaction',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  yourTransactionHasBeen: {
    en: 'Your transaction has been ',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  executed: {
    en: 'Executed!',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  yourTransactionIsCurrently: {
    en: 'Your transaction is currently ',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  executing: {
    en: 'Executing...',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  yourTransactionWasOnly: {
    en: 'Your transaction was only ',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  partiallyExecuted: {
    en: 'Partially Executed',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  thisTransactionWas: {
    en: 'This transaction was ',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  replaced: {
    en: 'Replaced',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  yourTransactionWas: {
    en: 'Your transaction was ',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  dropped: {
    en: 'Dropped',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  viewOnBlockExplorer: {
    en: 'View on block explorer',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  unableToGetSafeInfo: {
    en: 'Unable to get Safe Info',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  somethingWentWrong: {
    en: 'Something went wrong trying to get the information for your Safe.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  failedToCreateRejection: {
    en: 'Failed to create rejection',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  rejectTransactionWithNonce: {
    en: 'Reject Transaction',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  replaceTransaction: (nonce: number) => ({
    en: `To reject a Safe transaction, you must sign and execute another transaction with the same nonce. Once that transaction is confirmed, all other transactions with nonce ${nonce} will automatically be cancelled.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  createRejectionTransaction: {
    en: 'Continue',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  nonceWithNumber: (nonce: number) => ({
    en: `Nonce: ${nonce}`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  needToSignAndExecute: {
    en: `You will need to sign and execute this transaction to complete the rejection.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  submit: {
    en: 'Submit',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  copiedSignerAddress: {
    en: 'Copied signer address!',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  successfullyDeletedProposal: {
    en: 'Successfully deleted proposal!',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  successfullyUpdatedNonce: {
    en: 'Successfully updated nonce!',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  signedBy: {
    en: 'Signed By',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  delete: {
    en: 'Delete',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  reject: {
    en: 'Reject',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  done: {
    en: 'Done',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  retry: {
    en: 'Retry',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  deleteProposal: {
    en: 'Delete Proposal',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  confirmDeleteProposal: {
    en: 'Are you sure you want to delete this proposal?',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  expiredNonce: {
    en: 'Expired Nonce',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  expiredNonceBody: {
    en: 'A transaction with this nonce has already been executed, so this proposal cannot be executed on chain.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  duplicateNonce: {
    en: 'Duplicate Nonce',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  duplicateNonceBody: (nonce: number) => ({
    en: `Multiple proposals with the nonce ${nonce} exist. When one of these proposals are executed, others with the same nonce will be rejected.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
};
