import { formatMoney } from '../../common/format/number';
import { ILimitOrderType } from '../../graphql/client/generated/graphql';

export const localization = {
  noNotificationsYet: {
    en: 'No notifications yet',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  willBeNotified: {
    en: 'You will be notified here for events for your wallets.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  you: {
    en: 'You',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  createdAProposal: {
    en: 'created a proposal 💍',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  youWithWalletName: (walletName: string) => ({
    en: `You (${walletName})`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  signedAProposal: {
    en: 'signed a proposal 🖋️',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  executedAProposal: {
    en: 'executed a proposal ⚡',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  createdAMessage: {
    en: 'created a message 💬',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  signedAMessage: {
    en: 'signed a message 🖋️',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  receivedAmountAndSymbol: (amount: string, token: string) => ({
    en: `Received ${amount} ${token} `,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  fromTransactionDiamond: (transaction: string) => ({
    en: `from transaction ${transaction} 💎`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  receivedItem: (address: string | undefined, tokenId: string) => ({
    en: `Received ${address} #${tokenId} `,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  fromTransactionPicture: (transaction: string) => ({
    en: `from transaction ${transaction} 🖼️`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  limitOrderExecuted: (
    limitOrderType: ILimitOrderType,
    token: string,
    executedPrice: number,
  ) => ({
    en: `Your limit ${limitOrderType} of ${token} at $${formatMoney(
      executedPrice,
    )} has been executed.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  failedToGetNofications: {
    en: 'Failed to get notifications',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  failedToMarkNofications: {
    en: 'Failed to mark notifications as read',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  unableToGetNotifications: {
    en: 'Unable to get Notifications',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  unableToGetNotificationsDescription: {
    en: 'Something went wrong trying to get your notifications.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
};
