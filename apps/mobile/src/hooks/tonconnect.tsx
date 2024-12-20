import { Linking } from 'react-native';
import { tonConnectProvider } from '../provider/constants';

export function initializeTonConnectDeepLinks() {
  const onReceiveURL = async ({ url }: { url: string }) => {
    if (
      url.startsWith('tc://') ||
      url.startsWith('https://nestwallet.xyz/tonconnect')
    ) {
      await tonConnectProvider.connect(url);
    }
  };
  const handleInitialUrl = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      await onReceiveURL({ url: initialUrl });
    }
  };
  handleInitialUrl();
  tonConnectProvider.listenToUrl();
}
