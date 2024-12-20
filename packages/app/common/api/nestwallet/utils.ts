import { Platform } from 'react-native';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function getAPIEndpoint() {
  // return 'https://api.nestwallet.app';
  return process.env.NODE_ENV === 'production'
    ? 'https://api.nestwallet.app'
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
    : 'http://localhost:8080';
}

export const solanaRpcUrl = `${getAPIEndpoint()}/v1/rpc/svm/1399811149`;
