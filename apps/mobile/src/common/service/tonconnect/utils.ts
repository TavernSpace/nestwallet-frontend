import {
  ConnectRequest,
  DeviceInfo,
  SessionCrypto,
} from '@tonconnect/protocol';
import { Platform } from 'react-native';
import { isTablet } from 'react-native-device-info';
import { tonConnectProvider } from '../../../provider/constants';
import { TonConnectProvider } from './tonconnect-provider';

export function getPlatform(): DeviceInfo['platform'] {
  if (Platform.OS === 'ios') {
    return isTablet() ? 'ipad' : 'iphone';
  }
  return Platform.OS as DeviceInfo['platform'];
}

export function parseTonConnectParams(_url: string) {
  const url = new URL(_url);
  const decodedQuery = decodeURIComponent(url.search.slice(1));
  const params = new URLSearchParams(decodedQuery);

  const protocolVersion = params.get('v');
  const dappSessionId = params.get('id');
  const message = params.get('r');
  const ret = params.get('ret');

  if (!dappSessionId) {
    throw new Error('Error parsing TonConnect dappSessionId');
  }
  if (
    !protocolVersion ||
    !message ||
    !ret ||
    parseInt(protocolVersion) > TonConnectProvider.PROTOCOL_VERSION
  ) {
    const sessionCrypto = new SessionCrypto();
    const encryptionData = {
      dappSessionId,
      keyPair: sessionCrypto.stringifyKeypair(),
    };
    tonConnectProvider.postMessage(encryptionData, {
      event: 'connect_error',
      id: Date.now(),
      payload: {
        code: 1,
        message: 'Bad request',
      },
    });
    return;
  }
  return {
    protocolVersion: parseInt(protocolVersion),
    dappSessionId,
    message: JSON.parse(message) as ConnectRequest,
    ret,
  };
}
