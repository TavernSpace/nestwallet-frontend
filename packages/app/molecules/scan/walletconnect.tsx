import { Linking } from 'react-native';
import { ScanQRCode } from './scanner';

interface ScanWalletConnectQRCodeProps {
  onScan: (data: string) => Promise<void>;
  onBack: VoidFunction;
}

export function ScanWalletConnectQRCode(props: ScanWalletConnectQRCodeProps) {
  const { onScan, onBack } = props;

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  return (
    <ScanQRCode
      title='Scan WalletConnect'
      description='Select WalletConnect on a dApp and scan the QR code connect with your phone.'
      onScan={onScan}
      onBack={onBack}
      onRequestCamera={handleRequestCamera}
    />
  );
}
