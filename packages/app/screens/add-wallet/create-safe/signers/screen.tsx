import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import { useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { formatEVMAddress } from '../../../../common/format/evm';
import { ISignerWallet, RecipientAccount } from '../../../../common/types';
import { recordify } from '../../../../common/utils/functions';
import { adjust, withSize } from '../../../../common/utils/style';
import { ContactAvatar } from '../../../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../../../components/avatar/wallet-avatar';
import { BaseButton } from '../../../../components/button/base-button';
import { TextButton } from '../../../../components/button/text-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ListItem } from '../../../../components/list/list-item';
import { ScanBorder } from '../../../../components/scan';
import { SearchInput } from '../../../../components/search-input';
import { ActionSheet } from '../../../../components/sheet';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { WalletIcon } from '../../../../components/wallet-icon';
import { colors } from '../../../../design/constants';
import { useResolveENS } from '../../../../features/evm/ens/ens';
import { isEVMAddress } from '../../../../features/evm/utils';
import {
  IBlockchainType,
  IContact,
  IWallet,
  IWalletType,
} from '../../../../graphql/client/generated/graphql';
import { ScanAddressQRCode } from '../../../../molecules/scan/address';
import {
  NoResultsFound,
  Searching,
} from '../../../../molecules/select/address-select';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface CreateSafeSelectSignersScreenProps {
  safes: IWallet[];
  signers: ISignerWallet[];
  contacts: IContact[];
  onSelectSigners: (signers: RecipientAccount[]) => void;
  onToggleLock?: (enabled: boolean) => void;
}

export function CreateSafeSelectSignersScreen(
  props: CreateSafeSelectSignersScreenProps,
) {
  const { safes, signers, contacts, onSelectSigners, onToggleLock } = props;
  const { language } = useLanguageContext();
  const [selectedSigners, setSelectedSigners] = useState<
    Record<string, RecipientAccount>
  >({});
  const [searchInput, setSearchInput] = useState('');
  const [showScanSheet, setShowScanSheet] = useState(false);

  const handleRequestCamera = async () => {
    await Linking.openSettings();
  };

  const handleSelectAddress = async (account: RecipientAccount) => {
    const signers = { ...selectedSigners };
    if (selectedSigners[account.address]) {
      delete signers[account.address];
    } else {
      signers[account.address] = account;
    }
    setSelectedSigners(signers);
  };

  const handleCloseScanSheet = () => {
    setShowScanSheet(false);
    onToggleLock?.(true);
  };

  const {
    data: ensAddress,
    isPending: isSearchingENS,
    fetchStatus: fetchENSStatus,
  } = useResolveENS(searchInput);
  const isAddressValid = isEVMAddress(searchInput);
  const validSigners = Object.values(selectedSigners);
  const filteredContacts = useMemo(() => {
    const safeMap = recordify(safes, (safe) => safe.address);
    const signerMap = recordify(signers, (signer) => signer.address);
    return contacts.filter(
      (contact) => !safeMap[contact.address] && !signerMap[contact.address],
    );
  }, [safes, signers, contacts]);

  const matchedSafes = safes
    .filter((wallet) => wallet.type === IWalletType.Safe)
    .filter(
      (wallet) =>
        wallet.address.toLowerCase().includes(searchInput.toLowerCase()) ||
        wallet.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        (ensAddress &&
          wallet.address.toLowerCase().includes(ensAddress.toLowerCase())),
    );

  const matchedSigners = signers.filter(
    (signer) =>
      signer.address.toLowerCase().includes(searchInput.toLowerCase()) ||
      signer.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      (ensAddress &&
        signer.address.toLowerCase().includes(ensAddress.toLowerCase())),
  );

  const matchedContacts = filteredContacts.filter(
    (contact) =>
      contact.address.toLowerCase().includes(searchInput.toLowerCase()) ||
      contact.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      (ensAddress &&
        contact.address.toLowerCase().includes(ensAddress.toLowerCase())),
  );

  const matchedSelected = validSigners
    .filter((signer) => !signer.contact && !signer.wallet)
    .filter(
      (signer) =>
        signer.address.toLowerCase().includes(searchInput.toLowerCase()) ||
        signer.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
        (ensAddress &&
          signer.address.toLowerCase().includes(ensAddress.toLowerCase())),
    );

  const matchedAddress = isAddressValid
    ? ethers.getAddress(searchInput)
    : ensAddress
    ? ensAddress
    : undefined;

  const matchedAccounts =
    matchedSigners.length === 0 &&
    matchedContacts.length === 0 &&
    matchedSelected.length === 0 &&
    matchedAddress
      ? [
          {
            address: matchedAddress,
            name: ensAddress ? searchInput : undefined,
            wallet: matchedSafes.find(
              (safe) => safe.address === matchedAddress,
            ),
          },
        ]
      : matchedSelected
          .concat(
            matchedSigners.map(
              (signer): RecipientAccount => ({
                wallet: signer,
                address: signer.address,
              }),
            ),
          )
          .concat(
            matchedContacts.map(
              (contact): RecipientAccount => ({
                contact,
                address: contact.address,
              }),
            ),
          );

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<RecipientAccount, Record<string, RecipientAccount>>) => (
    <SignerItem
      key={item.address}
      account={item}
      selected={!!extraData![item.address]}
      onPress={() => {
        handleSelectAddress(item);
        setSearchInput('');
      }}
    />
  );

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      <View className='flex h-full w-full flex-col justify-between px-4'>
        <View className='flex flex-row items-center pb-2'>
          <SearchInput
            inputProps={{
              placeholder: localization.inputPlaceholder[language],
              onChangeText: (value) => setSearchInput(value),
              value: searchInput,
            }}
            onClear={() => setSearchInput('')}
          />
        </View>
        <View className='flex-1'>
          {isSearchingENS && fetchENSStatus !== 'idle' ? (
            <Searching />
          ) : matchedAccounts.length === 0 && searchInput !== '' ? (
            <NoResultsFound searchInput={searchInput} />
          ) : matchedAccounts.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={matchedAccounts}
              extraData={selectedSigners}
              estimatedItemSize={adjust(64)}
              renderItem={renderItem}
              keyExtractor={(item) => item.address}
              ListHeaderComponent={
                Platform.OS !== 'web' && searchInput === '' ? (
                  <ScanQRCodeItem
                    onPress={() => {
                      onToggleLock?.(false);
                      setShowScanSheet(true);
                    }}
                  />
                ) : undefined
              }
              contentContainerStyle={{
                paddingBottom: 8,
              }}
            />
          )}
        </View>
        <TextButton
          text={localization.confirmSigners[language]}
          onPress={() => onSelectSigners(validSigners)}
          disabled={validSigners.length === 0}
        />
      </View>
      {Platform.OS !== 'web' && (
        <ActionSheet
          isShowing={showScanSheet}
          onClose={handleCloseScanSheet}
          isFullHeight={true}
          hasTopInset={Platform.OS === 'android'}
          hasBottomInset={false}
        >
          <ScanAddressQRCode
            blockchain={IBlockchainType.Evm}
            onBack={handleCloseScanSheet}
            onRequestCamera={handleRequestCamera}
            onScanAddress={async (address) => {
              setSearchInput(address);
              handleCloseScanSheet();
            }}
          />
        </ActionSheet>
      )}
    </ViewWithInset>
  );
}

function SignerItem(props: {
  account: RecipientAccount;
  selected: boolean;
  onPress: VoidFunction;
}) {
  const { account, selected, onPress } = props;
  const { wallet, contact, name, address } = account;
  const { language } = useLanguageContext();
  const size = adjust(36);
  const displayName =
    wallet?.name ||
    contact?.name ||
    name ||
    localization.confirmSigners[language];
  const isSafe = wallet?.type === IWalletType.Safe;

  return (
    <BaseButton
      className='mb-1 w-full overflow-hidden rounded-xl'
      animationEnabled={false}
      onPress={!isSafe ? onPress : undefined}
    >
      <View
        className={cn(
          'flex w-full flex-row items-center justify-between rounded-xl px-2 py-3',
          {
            'bg-card': selected,
          },
        )}
      >
        <View className='flex flex-row space-x-4'>
          {wallet ? (
            <WalletAvatar size={size} wallet={wallet} />
          ) : contact ? (
            <ContactAvatar size={size} contact={contact} />
          ) : (
            <WalletIcon size={size} defaultStyle='neutral' />
          )}
          <View className='flex flex-col'>
            <View className='flex flex-row items-center space-x-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {displayName}
              </Text>
            </View>
            <View className='w-fit rounded-full'>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatEVMAddress(address)}
              </Text>
            </View>
          </View>
        </View>
        {!isSafe ? (
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-primary/10': selected,
              'bg-card-highlight': !selected,
            })}
            style={withSize(adjust(20, 2))}
          >
            <FontAwesomeIcon
              icon={faCheck}
              color={selected ? colors.primary : colors.textSecondary}
              size={adjust(12, 2)}
            />
          </View>
        ) : (
          <View className='bg-failure/10 flex w-fit flex-col items-center justify-center rounded-full px-2 py-1'>
            <Text className='text-failure text-xs font-medium'>
              {localization.invalidSignerSafe[language]}
            </Text>
          </View>
        )}
      </View>
    </BaseButton>
  );
}

function ScanQRCodeItem(props: { onPress: VoidFunction }) {
  const { onPress } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center space-x-4 px-2 py-3'>
        <View
          className='flex flex-row items-center justify-center'
          style={withSize(size)}
        >
          <ScanBorder
            size={adjust(24, 2)}
            length={8}
            thickness={3}
            color={colors.textPrimary}
            radius={6}
          />
        </View>
        <View className='flex flex-col'>
          <Text className='text-text-primary text-sm font-medium'>
            {localization.scanQRCode[language]}
          </Text>
        </View>
      </View>
    </ListItem>
  );
}

export function EmptyState() {
  const { language } = useLanguageContext();
  return (
    <View className='flex flex-col items-center justify-center px-8 py-6'>
      <Text className='text-text-primary text-sm font-medium'>
        {localization.noSigners[language]}
      </Text>
      <Text className='text-text-secondary mt-2 text-center text-sm font-normal'>
        {localization.noSignersImported[language]}
      </Text>
    </View>
  );
}
