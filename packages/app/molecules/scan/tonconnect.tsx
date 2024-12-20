import { Linking } from 'react-native';
import { ScanQRCode } from './scanner';

interface ScanTonConnectQRCodeProps {
  onScan: (data: string) => Promise<void>;
  onBack: VoidFunction;
}

export function ScanTonConnectQRCode(props: ScanTonConnectQRCodeProps) {
  const { onScan, onBack } = props;

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  return (
    <ScanQRCode
      title='Scan TonConnect'
      description='Scan a QR code on a TON dApp to connect with your phone.'
      onScan={onScan}
      onBack={onBack}
      onRequestCamera={handleRequestCamera}
    />
  );
}
