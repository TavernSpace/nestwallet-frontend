import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { Loadable, RecipientAccount } from '../../../common/types';
import { ActionSheet } from '../../../components/sheet';
import { View } from '../../../components/view';
import { onBlockchain } from '../../../features/chain';
import {
  IBlockchainType,
  IContact,
  IInteractedAddress,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { ScanAddressQRCode } from '../../../molecules/scan/address';
import { SearchWalletList } from '../../../molecules/select/address-select';
import { RecipientInput } from './recipient-input';

interface SelectRecipientSectionProps {
  chainId: number;
  wallet: IWallet;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
  interactions: Loadable<IInteractedAddress[]>;
  onChange: (recipient: RecipientAccount) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
  onToggleLock?: (enabled: boolean) => void;
}

export function SelectRecipientSection(props: SelectRecipientSectionProps) {
  const {
    chainId,
    wallet,
    wallets,
    contacts,
    interactions,
    onChange,
    onAddContact,
    onToggleLock,
  } = props;

  const [showScanSheet, setShowScanSheet] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  const handleCloseScanSheet = () => {
    setShowScanSheet(false);
    onToggleLock?.(true);
  };

  const handleScanQRCode =
    Platform.OS === 'web'
      ? undefined
      : () => {
          onToggleLock?.(false);
          setShowScanSheet(true);
        };

  return (
    <View className='bg-background h-full w-full flex-1'>
      <RecipientInput
        className='px-4'
        inputProps={{
          placeholder: onBlockchain(wallet.blockchain)(
            () => 'Search any Ethereum address or ENS',
            () => 'Search any Solana address',
            () => 'Search any TON address',
          ),
          onChangeText: setSearchInput,
          value: searchInput,
        }}
      />
      <SearchWalletList
        blockchain={wallet.blockchain}
        chainId={chainId}
        searchInput={searchInput}
        sourceWallet={wallet}
        address={searchInput}
        contacts={contacts.data || []}
        interactions={interactions.data}
        wallets={wallets}
        onScanQRCode={handleScanQRCode}
        onSelect={onChange}
        onAddContact={onAddContact}
      />
      {Platform.OS !== 'web' && (
        <ActionSheet
          isShowing={showScanSheet}
          onClose={handleCloseScanSheet}
          isFullHeight={true}
          hasTopInset={Platform.OS === 'android'}
          hasBottomInset={false}
        >
          <ScanAddressQRCode
            address={wallet.address}
            blockchain={wallet.blockchain}
            onBack={handleCloseScanSheet}
            onRequestCamera={handleRequestCamera}
            onScanAddress={async (address) => {
              onChange({ address });
              handleCloseScanSheet();
            }}
          />
        </ActionSheet>
      )}
    </View>
  );
}
