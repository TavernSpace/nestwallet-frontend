export const localization = {
  ethereum: {
    en: 'Ethereum',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  solana: {
    en: 'Solana',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  ton: {
    en: 'TON',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  noWalletsFound: {
    en: 'No wallets found',
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  },
  walletNotFound: (formattedAddress?: string) => ({
    en: `We couldn't find a wallet with the address ${formattedAddress}. Either connect to the DApp again with a different wallet or import this wallet.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
  noWalletsForChain: (chainName: string) => ({
    en: `We couldn't find any wallets for ${chainName}. Either refresh your wallets or import a wallet and try again.`,
    es: 'PLACEHOLDER',
    zh: 'PLACEHOLDER',
  }),
};
