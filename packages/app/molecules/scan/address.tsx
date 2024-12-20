import { parseAddressQRCode } from '../../common/utils/qr';
import { onBlockchain } from '../../features/chain';
import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { ScanQRCode } from './scanner';

interface ScanScreenProps {
  address?: string;
  blockchain?: IBlockchainType;
  onScanAddress: (address: string) => Promise<void>;
  onBack: VoidFunction;
  onRequestCamera: VoidFunction;
}

export function ScanAddressQRCode(props: ScanScreenProps) {
  const { address, blockchain, onScanAddress, onBack, onRequestCamera } = props;

  const handleScan = async (data: string) => {
    if (blockchain) {
      const result = parseAddressQRCode(data, blockchain);
      if (!result) {
        throw new Error(
          `This code does not contain a valid ${onBlockchain(blockchain)(
            () => 'Ethereum',
            () => 'Solana',
            () => 'TON',
          )} address`,
        );
      } else if (result === address) {
        throw new Error('The scanned address is the same as the sender');
      }
      await onScanAddress(result);
    } else {
      await onScanAddress(data);
    }
  };

  return (
    <ScanQRCode
      title='Scan Address'
      description={`Scan a QR code of a wallet to quickly enter it's address.`}
      onScan={handleScan}
      onBack={onBack}
      onRequestCamera={onRequestCamera}
    />
  );
}
