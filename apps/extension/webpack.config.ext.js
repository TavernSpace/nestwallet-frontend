const path = require('path');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ProgressBar = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const pkgJson = require('./package.json');
const webpack = require('webpack');
const rootDirectory = __dirname;

const allowList = require('./assets/allowlist.json');

module.exports = (env) => {
  const { ifProduction, ifNotProduction } = getIfUtils(env);
  const config = {
    mode: ifProduction('production', 'development'),
    entry: {
      injected: path.join(rootDirectory, 'contentscript/injected/index.ts'),
      popupMessage: path.join(
        rootDirectory,
        'contentscript/injected/popupMessage.ts',
      ),
      contentscript: path.join(rootDirectory, 'contentscript/index.ts'),
      serviceworker: path.join(rootDirectory, 'serviceworker/index.ts'),
    },
    output: {
      path: path.resolve(rootDirectory, 'web-build'),
      filename: '[name].js',
      chunkFilename: '[name].js',
      clean: ifProduction(false, true),
      publicPath: '',
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: [/node_modules/],
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
    plugins: removeEmpty([
      ifNotProduction(new CleanWebpackPlugin()),
      new ForkTsCheckerWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(rootDirectory, 'assets/manifest.json'),
            transform: (buffer) => {
              const manifestJson = JSON.parse(buffer.toString());
              // TODO: data: is required due to fontawesome, seems to only be back arrow and faBars for now, maybe should just add hash for those
              const imgSrc = `img-src https: http://localhost:8080 data:;`;
              const connectSrc = `connect-src 'self' ${allowList[
                'connect-src'
              ].join(' ')};`;
              const frameSrc = `frame-src 'self' ${allowList['frame-src'].join(
                ' ',
              )};`;
              const fontSrc = `font-src 'self' ${allowList['font-src'].join(
                ' ',
              )};`;
              const styleSrc = `style-src 'self' 'unsafe-inline' ${allowList[
                'style-src'
              ].join(' ')};`;
              manifestJson.content_security_policy.extension_pages = `${manifestJson.content_security_policy.extension_pages} ${imgSrc} ${connectSrc} ${frameSrc} ${fontSrc} ${styleSrc}`;
              manifestJson.version = pkgJson.version;
              return Buffer.from(JSON.stringify(manifestJson));
            },
          },
          {
            from: path.resolve(rootDirectory, 'assets/images'),
            to: 'images',
          },
          {
            from: path.resolve(rootDirectory, 'assets/favicons'),
          },
          {
            from: path.resolve(rootDirectory, 'assets/vendor'),
            to: 'vendor',
          },
          {
            from: path.resolve(rootDirectory, 'assets/fonts'),
            to: 'fonts',
          },
          {
            from: path.resolve(
              rootDirectory,
              'assets/trezor-usb-permissions.html',
            ),
          },
        ],
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      ifProduction(new ProgressBar()),
    ]),
    optimization: ifProduction({
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ],
    }),
    resolve: {
      extensions: ['.js', '.ts'],
      fallback: {
        buffer: require.resolve('buffer'),
        "crypto": require.resolve("crypto-browserify"),
        'process/browser': require.resolve('process/browser'),
        zlib: false,
        http: false,
        https: false,
      },
    },
    devtool: ifProduction(false, 'cheap-module-source-map'),
    devServer: {
      host: 'localhost',
      port: 3004,
      allowedHosts: 'all',
      compress: false,
      client: {
        overlay: false,
      },
      devMiddleware: {
        writeToDisk: true,
      },
    },
  };
  return config;
};
