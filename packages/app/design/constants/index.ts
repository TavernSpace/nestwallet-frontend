import { Dimensions, Platform } from 'react-native';

export const SCREEN_WIDTH =
  Platform.OS === 'web' ? 375 : Dimensions.get('window').width;
export const SCREEN_HEIGHT =
  Platform.OS === 'web' ? 600 : Dimensions.get('window').height;

export const colors = {
  primary: '#EEF455',

  background: '#0B0E14',
  card: '#0F141E',
  cardHighlight: '#131B2A',
  cardHighlightSecondary: '#162235',
  cardNeutralBright: '#1B2941',

  textPrimary: '#FFFFFF',
  textSecondary: '#496183',
  textPlaceholder: '#496183',
  textButtonPrimary: '#000000',
  textEyebrow: '#9D9EA0',
  divider: '#1A2133',
  success: '#1BDBA1',
  failure: '#CA235F',
  warning: '#FF9055',
  info: '#2CCCFF',
  infoNeutral: '#131925',
  soulbound: '#00FFE9',
  link: '#2C5ECC',

  // Wallet default colors
  seedPrimary: '#1BDBA1',
  seedSecondary: '#00FFE9',
  seedTertiary: '#3FBACB',
  keyPrimary: '#2CCCFF',
  keySecondary: '#4E5DE7',
  keyTertiary: '#7491F8',

  // tx action colors
  send: '#1C77FF',
  receive: '#23D6C1',
  trade: '#BE0775',
  approve: '#2CCCFF',
  swap: '#4B1AFF',
  swapLight: '#4E5DE7',
  bridge: '#BE0775',
  buyNft: '#DF7539',
  sellNft: '#1F8472',
  nftTrade: '#AE89FF',
  mint: '#F7DD51',
  execute: '#29548E',
  pnl: '#9E4BCA',

  messageSign: '#BE8958',

  safeOwnerAdd: '#00FA46',
  safeOwnerRemove: '#B352EF',
  safeOwnerModify: '#4F7199',

  // quest colors
  questTime: '#9784FF',
  questClaim: '#36CFCF',
  questBorder: '#AF9127',

  // other app colors:
  incognito: '#4858E5',

  // brand colors:
  twitter: '#1DA1F2',
  telegram: '#27A8E9',
  whatsapp: '#24D366',
  discord: '#5765F2',
  safe: '#12FF80',
  moonshot: '#DFFF18',
  pumpfun: '#54D492',
  fourmeme: '#7BF658',

  // chain colors
  arbitrum: '#00A3FF',
  avalanche: '#E84142',
  base: '#0052FF',
  blast: '#FCFC03',
  bsc: '#EAB200',
  celo: '#FCFF52',
  ethereum: '#6B8AFF',
  fantom: '#1969FF',
  gnosis: '#06806A',
  linea: '#FFFFFF',
  optimism: '#FF0420',
  polygon: '#9558FF',
  scroll: '#EBC28E',
  zora: '#3850B5',
  zksync: '#8C8DFC',
  solana: '#B24AEE',
  evm: '#599CFF',
  ton: '#0098EA',

  // rarities
  common: '#EEF455',
  rare: '#DF36FB',
  veryRare: '#FB3636',
};
