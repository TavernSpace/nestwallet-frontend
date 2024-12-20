const defaultTheme = require('tailwindcss/defaultTheme');
const { rem2px } = require('./util');

// @ts-check

/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  // edit your tailwind theme here!
  // https://tailwindcss.com/docs/adding-custom-styles
  borderRadius: rem2px(defaultTheme.borderRadius),
  columns: rem2px(defaultTheme.columns),
  fontSize: {
    ...rem2px(defaultTheme.fontSize),
    xss: '10px',
  },
  lineHeight: rem2px(defaultTheme.lineHeight),
  maxWidth: ({
    ...rem2px(defaultTheme.maxWidth),
    '1/2': '50%',
    '3/4': '75%',
  }),
  spacing: rem2px(defaultTheme.spacing),

  colors: {
    primary: '#EEF455',
    background: '#0B0E14',
    card: '#0F141E',
    'card-highlight': '#131B2A',
    'card-highlight-secondary': '#162235',
    'text-primary': '#FFFFFF',
    'text-secondary': '#496183',
    'text-placeholder': '#496183',
    'text-button-primary': '#000000',
    'text-eyebrow': '#9D9EA0',
    divider: '#1A2133',
    success: '#1BDBA1',
    failure: '#CA235F',
    warning: '#FF9055',
    info: '#2CCCFF',
    soulbound: '#00FFE9',
    link: '#2C5ECC',

    // wallet colors
    'seed-primary': '#1BDBA1',
    'seed-secondary': '#00FFE9',
    'seed-tertiary': '#3FBACB',
    'key-primary': '#2CCCFF',
    'key-secondary': '#4E5DE7',
    'key-tertiary': '#7491F8',

    // action button colors
    send: '#1C77FF',
    swap: '#4B1AFF',
    bridge: '#BE0775',
    trade: '#BE0775',
    receive: '#23D6C1',
    approve: '#2CCCFF',
    'swap-light': '#4E5DE7',

    // other app colors
    incognito: '#4858E5',

    // brand colors:
    'twitter': '#1DA1F2',
    'discord': '#5765F2',
    'telegram': '#27A8E9',
    'whatsapp': '#24D366',
  },  
};

module.exports = {
  theme,
};

