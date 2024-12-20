import { ethers } from 'ethers';
import { uniqBy } from 'lodash';
import { delay } from '../../../../common/api/utils';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { AssetTransfer, ISignerWallet } from '../../../../common/types';
import { loadDataFromQuery } from '../../../../common/utils/query';
import { getTransfersSafeTransactionProposalInput } from '../../../../features/safe/transfer';
import {
  IBlockchainType,
  IContact,
  ICreateTransactionProposalInput,
  IOrganization,
  ITransactionProposal,
  ITransactionProposalType,
  IWallet,
  IWalletType,
  useContactsQuery,
  useCreateTransactionProposalMutation,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { SafeTransferReviewScreen } from './screen';

interface SafeTransferReviewQueryProps {
  wallet: IWallet;
  transfers: AssetTransfer[];
  organization: IOrganization;
  signers: ISignerWallet[];
  onAddTransfer: VoidFunction;
  onDeleteTransfer: (transfer: AssetTransfer) => void;
  onProposalCreated: (propoasl: ITransactionProposal) => void;
}

export function SafeTransferReviewWithQuery(
  props: SafeTransferReviewQueryProps,
) {
  const { transfers, wallet, onProposalCreated } = props;

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
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const createTransactionProposalMutation = useMutationEmitter(
    [
      graphqlType.Proposal,
      graphqlType.PendingTransaction,
      graphqlType.Notification,
    ],
    useCreateTransactionProposalMutation(),
  );

  const handleSubmit = async () => {
    if (transfers.length === 0) return;
    if (wallet.type !== IWalletType.Safe) {
      throw new Error('only safe transfers are supported');
    }
    const interactions = uniqBy(
      transfers.map((transfer) => ({
        address: ethers.getAddress(transfer.recipient),
        chainId: wallet.chainId,
        interactionCount: 0,
        sendCount: 1,
      })),
      (item) => item.address,
    );
    const proposalInput: ICreateTransactionProposalInput = {
      type: ITransactionProposalType.Safe,
      safe: await getTransfersSafeTransactionProposalInput(wallet, transfers),
      interactedAddresses: interactions,
    };
    const proposal = await createTransactionProposalMutation.mutateAsync({
      input: proposalInput,
    });
    // Delay to prevent ui lag
    await delay(150);
    onProposalCreated(
      proposal.createTransactionProposal as ITransactionProposal,
    );
  };

  return (
    <SafeTransferReviewScreen
      {...props}
      contacts={contacts}
      onSubmit={handleSubmit}
    />
  );
}
