import createExpoWebpackConfigAsync from '@expo/webpack-config/webpack';
import { Arguments, Environment } from '@expo/webpack-config/webpack/types';
import path from 'path';
import { ProvidePlugin } from 'webpack';
import { getIfUtils } from 'webpack-config-utils';

module.exports = async function (env: Environment, argv: Arguments) {
  const { ifProduction } = getIfUtils(env.mode);
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          'nativewind',
          'react-native-reanimated',
        ],
      },
    },
    argv,
  );

  config.ignoreWarnings = [/Failed to parse source map/];

  config.module!.rules!.push({
    test: /\.(js|ts|tsx)$/,
    include: /packages\/.+/,
    exclude: /node_modules/,
    use: 'babel-loader',
  });

  config.module!.rules!.push({
    test: /\.css$/i,
    use: ['postcss-loader'],
  });

  config.plugins = [
    ...(config.plugins ?? []),
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  config.resolve!.alias = {
    ...config.resolve!.alias,
    // https://github.com/TanStack/query/issues/3595#issuecomment-1353601727
    '@tanstack/react-query': path.resolve(
      require.resolve('@tanstack/react-query'),
      '../../../',
    ),
    '@nestwallet/app': path.resolve(__dirname, '../../packages/app'),
    'react-native/Libraries/Image/AssetRegistry$':
      'react-native-web/dist/modules/AssetRegistry',
  };

  config.resolve!.fallback = {
    ...config.resolve!.fallback,
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    zlib: false,
    http: false,
    https: false,
  };

  config.resolve!.symlinks = true;

  config.devtool = ifProduction(false, 'cheap-module-source-map');

  config.devServer = {
    ...config.devServer,
    devMiddleware: {
      writeToDisk: true,
    },
  };

  return config;
};
