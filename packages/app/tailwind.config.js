const { theme } = require('./design/tailwind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.{jsx,tsx}'],
  plugins: [require('nativewind/tailwind/css')],
  important: 'html',
  theme: {
    extend: theme
  }
};

