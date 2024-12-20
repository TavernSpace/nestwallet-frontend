const { theme } = require('@nestwallet/app/design/tailwind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/**/*.{jsx,tsx}',
  ],
  plugins: [require('nativewind/tailwind/css')],
  important: 'html',
  theme: {
    extend: theme,
  },
};
