const { withExpo } = require('@expo/next-adapter');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'content-type', value: 'application/json' }],
      },
    ];
  },
  async rewrites() {
    return [
      // ensure that we can serve the apple-app-site-association
      {
        source: '/.well-known/apple-app-site-association',
        destination:
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/.well-known/apple-app-site-association',
      },
      // used for proxying local build to prod server
      {
        source: '/api/:path*',
        destination: 'https://api.nestwallet.app/:path*',
      },
    ];
  },
  transpilePackages: [
    '@fortawesome/react-native-fontawesome',
    '@nestwallet/app',
    'expo',
    'expo-constants',
    'expo-haptics',
    'expo-image',
    'expo-av',
    'expo-modules-core',
    'nativewind',
    'react-native',
    'react-native-web',
    'react-native-paper',
    'react-native-svg',
    'react-native-vector-icons',
    'react-native-safe-area-context',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-async-storage',
  ],
  images: {
    domains: ['localhost', 'api.nestwallet.app'],
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.(mp4|webm|mov|ogg|swf|ogv)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: `/_next/static/videos/`,
            outputPath: `${isServer ? '../' : ''}static/videos/`,
            name: '[name].[hash].[ext]',
            esModule: false,
          },
        },
      ],
    });

    return config;
  },
};

module.exports = withExpo(nextConfig);
