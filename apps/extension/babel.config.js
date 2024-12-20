module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { loose: true, jsxRuntime: 'automatic' }]],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      ['@babel/plugin-proposal-private-methods', { loose: true }],
      'react-native-reanimated/plugin',
      'nativewind/babel',
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
