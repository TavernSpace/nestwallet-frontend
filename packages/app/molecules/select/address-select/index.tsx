import cn from 'classnames';
import { ethers } from 'ethers';
import _ from 'lodash';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import { RecipientAccount } from '../../../common/types';
import { recordify } from '../../../common/utils/functions';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { SectionList } from '../../../components/flashlist/section-list';
import { ListItem } from '../../../components/list/list-item';
import { ScanBorder } from '../../../components/scan';
import { SearchInput } from '../../../components/search-input';
import { WalletItemSkeleton } from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { isValidAddress } from '../../../features/blockchain/utils';
import { getChainInfo, onBlockchain } from '../../../features/chain';
import { useResolveENS } from '../../../features/evm/ens/ens';
import { normalizeENS } from '../../../features/evm/ens/utils';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { normalizeTONAddress } from '../../../features/tvm/utils';
import {
  IBlockchainType,
  IContact,
  IInteractedAddress,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { AccountListItem } from './account-list-item';
import { AddContactSheet } from './add-contact-sheet';

export function AddressSelect(props: {
  blockchain: IBlockchainType;
  chainId: number;
  wallets?: IWallet[];
  contacts?: IContact[];
  interactions?: IInteractedAddress[];
  onScanQRCode?: VoidFunction;
  onChange: (account: RecipientAccount) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
}) {
  const {
    blockchain,
    wallets,
    contacts,
    chainId,
    onScanQRCode,
    onChange,
    onAddContact,
  } = props;

  const [searchInput, setSearchInput] = useState('');

  return (
    <View className='bg-background h-full w-full flex-1'>
      <View className='flex flex-row items-center px-4'>
        <SearchInput
          inputProps={{
            placeholder: onBlockchain(blockchain)(
              () => 'Search any Ethereum address or ENS',
              () => 'Search any Solana address',
              () => 'Search any TON address',
            ),
            onChangeText: (value) => setSearchInput(value),
            value: searchInput,
          }}
          onClear={() => setSearchInput('')}
        />
      </View>
      <SearchWalletList
        className='pt-4'
        blockchain={blockchain}
        searchInput={searchInput}
        address={searchInput}
        contacts={contacts}
        wallets={wallets}
        chainId={chainId}
        onScanQRCode={onScanQRCode}
        onSelect={onChange}
        onAddContact={onAddContact}
      />
    </View>
  );
}

type SectionListItem = { id: string; address: string } | IWallet | IContact;
type SectionListSection = { title: string; data: Array<SectionListItem> };

export const SearchWalletList = styled(function (props: {
  blockchain: IBlockchainType;
  chainId: number;
  sourceWallet?: IWallet;
  searchInput: string;
  address: string;
  wallets?: IWallet[];
  contacts?: IContact[];
  interactions?: IInteractedAddress[];
  onScanQRCode?: VoidFunction;
  onSelect: (account: RecipientAccount) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
}) {
  const {
    blockchain,
    searchInput,
    sourceWallet,
    address,
    chainId,
    contacts = [],
    wallets = [],
    interactions,
    onScanQRCode,
    onSelect,
    onAddContact,
  } = props;
  const { bottom } = useSafeAreaInsets();

  const [showAddContactSheet, setShowAddContactSheet] = useState(false);

  const {
    data: ensAddress,
    isPending: isSearchingENS,
    fetchStatus: fetchENSStatus,
  } = useResolveENS(address, { enabled: blockchain === IBlockchainType.Evm });

  const interactionMap = useMemo(
    () =>
      interactions
        ? recordify(interactions, (item) => item.address.toLowerCase())
        : undefined,
    [interactions],
  );

  const chainInfo = getChainInfo(chainId);
  const isAddressValid = isValidAddress(blockchain, address);

  const matchedWallets = wallets
    .filter((wallet) => wallet.blockchain === chainInfo.blockchain)
    .filter((wallet) => wallet.address !== sourceWallet?.address)
    .filter((wallet) => wallet.chainId === 0 || wallet.chainId === chainId)
    .filter(
      (wallet) =>
        wallet.address.toLowerCase().includes(address.toLowerCase()) ||
        wallet.name.toLowerCase().includes(address.toLowerCase()) ||
        (ensAddress &&
          wallet.address.toLowerCase().includes(ensAddress.toLowerCase())),
    );

  const matchedContacts = contacts
    .filter((contact) => contact.blockchain === chainInfo.blockchain)
    .filter((contact) => contact.address !== sourceWallet?.address)
    .filter(
      (contact) =>
        contact.chains.length === 0 || contact.chains.includes(chainId),
    )
    .filter(
      (contact) =>
        contact.address.toLowerCase().includes(address.toLowerCase()) ||
        contact.name.toLowerCase().includes(address.toLowerCase()) ||
        (ensAddress &&
          contact.address.toLowerCase().includes(ensAddress.toLowerCase())),
    );

  const matchedAddress = isAddressValid
    ? address
    : ensAddress
    ? ensAddress
    : undefined;

  const matchedBadSafe = wallets.find(
    (wallet) =>
      wallet.type === IWalletType.Safe &&
      matchedAddress === wallet.address &&
      wallet.chainId !== chainId,
  );

  const matchedSourceWallet =
    sourceWallet &&
    matchedAddress?.toLowerCase() === sourceWallet?.address.toLowerCase()
      ? sourceWallet
      : undefined;

  const sections = useMemo(
    () =>
      [
        {
          title: 'SEARCH RESULTS',
          data:
            matchedAddress &&
            matchedWallets.length === 0 &&
            matchedContacts.length === 0
              ? [{ id: matchedAddress, address: matchedAddress }]
              : [],
        },
        {
          title: 'WALLETS',
          data: matchedWallets,
        },
        {
          title: 'CONTACTS',
          data: matchedContacts,
        },
      ].filter((item) => item.data.length > 0),
    [matchedAddress, matchedWallets, matchedContacts],
  );

  if (isSearchingENS && fetchENSStatus !== 'idle') {
    return <Searching />;
  }

  const renderItem = ({
    item,
    section,
  }: {
    item: SectionListItem;
    section: SectionListSection;
  }) => {
    const interactionCount = interactionMap
      ? interactionMap[item.address.toLowerCase()]?.sendCount
      : undefined;

    if (section.title === 'SEARCH RESULTS') {
      const badWallet = matchedSourceWallet || matchedBadSafe;
      const [name, domain] = normalizeENS(address);
      return (
        <AccountListItem
          name={
            badWallet
              ? badWallet.name
              : ensAddress
              ? `${name}.${domain}`
              : 'Unknown Address'
          }
          address={item.address}
          chainId={chainId}
          wallet={badWallet}
          duplicate={!!matchedSourceWallet}
          interactionCount={interactionCount ?? 0}
          onPress={() =>
            onSelect({
              address: ensAddress ?? address,
              name: ensAddress ? `${name}.${domain}` : undefined,
              interactions: interactionCount,
            })
          }
        />
      );
    } else if (section.title === 'WALLETS') {
      const wallet = item as IWallet;
      return (
        <AccountListItem
          name={wallet.name}
          address={wallet.address}
          chainId={chainId}
          wallet={wallet}
          interactionCount={interactionCount}
          onPress={() =>
            onSelect({
              address: wallet.address,
              name: wallet.name,
              wallet: wallet,
              interactions: interactionCount,
            })
          }
        />
      );
    } else if (section.title === 'CONTACTS') {
      const contact = item as IContact;
      return (
        <AccountListItem
          name={contact.name}
          address={contact.address}
          chainId={chainId}
          contact={contact}
          interactionCount={interactionCount}
          onPress={() =>
            onSelect({
              address: contact.address,
              name: contact.name,
              contact: contact,
              interactions: interactionCount,
            })
          }
        />
      );
    }
    return null;
  };

  const hasQrCode = !!onScanQRCode && address === '';

  const handleSubmitContact = async (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => {
    const normalizedAddress = onBlockchain(blockchain)(
      () => ethers.getAddress(address),
      () => address,
      () => normalizeTONAddress(address),
    );
    await onAddContact(name, normalizedAddress, blockchain);
    setShowAddContactSheet(false);
  };

  return (
    <>
      <View
        className={cn('h-full flex-1', {
          'pt-4': !hasQrCode,
        })}
      >
        <SectionList<SectionListItem, SectionListSection>
          sections={sections}
          estimatedItemSize={adjust(60)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={{ interactions: interactionMap }}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              className={cn('text-text-secondary px-4 text-xs font-medium', {
                'py-2': !hasQrCode,
              })}
            >
              {title}
            </Text>
          )}
          ListEmptyComponent={<NoResultsFound searchInput={searchInput} />}
          ListHeaderComponent={
            hasQrCode ? <ScanQRCodeItem onPress={onScanQRCode} /> : undefined
          }
          ListFooterComponent={
            sections[0]?.title === 'SEARCH RESULTS' &&
            !matchedSourceWallet &&
            !matchedBadSafe ? (
              <AddContactButton onPress={() => setShowAddContactSheet(true)} />
            ) : undefined
          }
          contentContainerStyle={{
            paddingBottom: bottom,
          }}
        />
      </View>
      {matchedAddress && (
        <AddContactSheet
          isShowing={showAddContactSheet}
          defaultName={ensAddress ? searchInput : undefined}
          onClose={() => setShowAddContactSheet(false)}
          onSubmit={(name: string) =>
            handleSubmitContact(name, matchedAddress, blockchain)
          }
        />
      )}
    </>
  );
});

export function NoResultsFound(props: { searchInput: string }) {
  const { searchInput } = props;

  return (
    <View className='flex w-full flex-col items-center justify-center'>
      <WalletItemSkeleton fixed />
      <WalletItemSkeleton fixed />
      {!_.isEmpty(searchInput) && (
        <View className='flex flex-col items-center justify-center px-8 pt-1'>
          <Text className='text-text-primary text-sm font-medium'>
            No Results Found
          </Text>
          <Text className='text-text-secondary mt-2 text-center text-xs font-normal'>
            The address you typed either does not exist or is spelled
            incorrectly
          </Text>
        </View>
      )}
    </View>
  );
}

export function Searching() {
  return (
    <View className='flex flex-col items-center justify-center px-8 py-6'>
      <Text className='text-text-primary text-sm font-medium'>
        Searching...
      </Text>
    </View>
  );
}

function ScanQRCodeItem(props: { onPress: VoidFunction }) {
  const { onPress } = props;

  const size = adjust(36);

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center space-x-4 px-4 py-3'>
        <View className='items-center justify-center' style={withSize(size)}>
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
            {'Scan QR Code'}
          </Text>
        </View>
      </View>
    </ListItem>
  );
}

function AddContactButton(props: { onPress: VoidFunction }) {
  const { onPress } = props;

  return (
    <View className='flex flex-row justify-center pt-4'>
      <TextButton className='w-1/2' text='Add as Contact' onPress={onPress} />
    </View>
  );
}
