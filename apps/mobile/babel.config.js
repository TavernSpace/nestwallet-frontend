module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      // https://github.com/facebook/react-native/issues/36828#issuecomment-1578924257
      '@babel/plugin-transform-flow-strip-types',
      '@babel/plugin-proposal-export-namespace-from',
      // https://github.com/ethers-io/ethers.js/discussions/4309
      ['@babel/plugin-transform-private-methods', { loose: true }],
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
