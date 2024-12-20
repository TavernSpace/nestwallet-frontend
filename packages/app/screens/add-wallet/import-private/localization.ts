export const localization = {
  defaultError: {
    en: 'Error importing key',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  placeHolder: (lengthText: string) => ({
    en: `${lengthText} character private key`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  anEthereum: {
    en: 'An Ethereum',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  aSolana: {
    en: 'A Solana',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  aTON: {
    en: 'A TON',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  lowercaseHex: {
    en: 'lowercase hex string without 0x at the start',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  base58String: {
    en: 'base 58 string',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  privateKeyRules: (
    lengthText: string,
    blockchainText: string,
    privateKeyRule: string,
  ) => ({
    en: `${blockchainText} private key should be a ${lengthText} character ${privateKeyRule}.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  encryptedKeysMessage: {
    en: 'Your keys are encrypted and stored locally. Nest Wallet never has access to your wallets or keys.',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  import: {
    en: 'Import',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  schemaCharacterLengthExact: (length: number) => ({
    en: `Must be exactly ${length} characters`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  schemaCharacterLengthRangeSol: (length: number) => ({
    en: `Must be ${length - 1}-${length} characters`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  schemaHexCharacters: {
    en: 'Must be hex characters',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  schemaBase58Characters: {
    en: 'Must be base58 characters',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
};
