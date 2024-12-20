import { useState } from 'react';
import {
  useMutationEmitter,
  useQueryRefetcher,
} from '../../../common/hooks/query';
import { AssetTransfer, RecipientAccount } from '../../../common/types';
import { empty } from '../../../common/utils/functions';
import { loadDataFromQuery } from '../../../common/utils/query';
import { isCryptoBalance } from '../../../common/utils/types';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IInteractedAddress,
  IInteractionType,
  INftBalance,
  IWallet,
  useContactsQuery,
  useInteractedAddressesQuery,
  useUpsertContactMutation,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { sanitizeUpsertContactMutation } from '../../../graphql/utils';
import { AssetSelect } from '../../../molecules/select/asset-select';
import { useCryptoPositions, useNftBalances } from '../utils';
import { SelectRecipientSection } from './select-recipient';
import { SendNFTForm } from './send-nft-form';
import { SendTokenForm } from './send-token-form';

interface TransferAssetFormProps {
  initialAsset?: ICryptoBalance | INftBalance;
  transfers?: AssetTransfer[];
  wallet: IWallet;
  wallets: IWallet[];
  onAddTransfer: (transfer: AssetTransfer) => Promise<void>;
  onToggleLock?: (enabled: boolean) => void;
}

export function TransferAssetForm(props: TransferAssetFormProps) {
  const {
    initialAsset,
    transfers = [],
    wallet,
    wallets,
    onToggleLock,
    onAddTransfer,
  } = props;
  const { cryptoBalances } = useCryptoPositions(wallet, transfers);
  const { nftBalances } = useNftBalances(wallet, transfers);
  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: wallet.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) => data.contacts as IContact[],
  );

  const upsertContactMutation = useMutationEmitter(
    graphqlType.Contact,
    useUpsertContactMutation(),
  );

  const handleAddContact = async (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => {
    const input = sanitizeUpsertContactMutation({
      name,
      address,
      blockchain,
      organizationId: wallet.organization.id,
    });
    await upsertContactMutation.mutateAsync({ input });
    await contactsQuery.refetch().catch(empty);
  };

  const interactionsQuery = useQueryRefetcher(
    [graphqlType.Proposal, graphqlType.PendingTransaction],
    useInteractedAddressesQuery(
      {
        input: {
          interactionType: IInteractionType.Send,
        },
      },
      { staleTime: 1000 * 60 },
    ),
  );
  const interactions = loadDataFromQuery(
    interactionsQuery,
    (data) => data.interactedAddresses as IInteractedAddress[],
  );

  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [selectedRecipient, setSelectedRecipient] =
    useState<RecipientAccount>();

  const handleChangeAsset = () => setSelectedAsset(undefined);
  const handleChangeRecipient = () => setSelectedRecipient(undefined);

  const hasBottomInset = !!selectedAsset && !!selectedRecipient;

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={hasBottomInset}
        shouldAvoidKeyboard={true}
      >
        {!selectedAsset ? (
          <AssetSelect
            blockchain={wallet.blockchain}
            cryptos={cryptoBalances}
            nfts={nftBalances}
            onChange={setSelectedAsset}
          />
        ) : !selectedRecipient ? (
          <SelectRecipientSection
            chainId={selectedAsset.chainId}
            wallet={wallet}
            wallets={wallets}
            contacts={contacts}
            interactions={interactions}
            onChange={setSelectedRecipient}
            onAddContact={handleAddContact}
            onToggleLock={onToggleLock}
          />
        ) : isCryptoBalance(selectedAsset) ? (
          <SendTokenForm
            asset={selectedAsset}
            recipient={selectedRecipient}
            onChangeAsset={handleChangeAsset}
            onChangeRecipient={handleChangeRecipient}
            onAddTransfer={onAddTransfer}
          />
        ) : (
          <SendNFTForm
            asset={selectedAsset}
            recipient={selectedRecipient}
            onChangeAsset={handleChangeAsset}
            onChangeRecipient={handleChangeRecipient}
            onAddTransfer={onAddTransfer}
          />
        )}
      </ViewWithInset>
    </View>
  );
}
