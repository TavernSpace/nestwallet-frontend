/** @type {import('tailwindcss').Config} */
const { theme } = require('@nestwallet/app/design/tailwind/theme');

module.exports = {
  content: [
    './App.tsx',
    './popup/**/*.tsx',
    '../../packages/app/**/*.{jsx,tsx}',
  ],
  theme: {
    extend: theme,
  },
};
