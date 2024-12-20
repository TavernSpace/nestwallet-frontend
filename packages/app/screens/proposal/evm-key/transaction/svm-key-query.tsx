import base58 from 'bs58';
import { useEffect, useState } from 'react';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { ISignerWallet } from '../../../../common/types';
import {
  loadDataFromQuery,
  makeLoadableError,
} from '../../../../common/utils/query';
import { ChainId } from '../../../../features/chain';
import { tagSvmKeyTransactionProposal } from '../../../../features/proposal/utils';
import {
  IBlockchainType,
  IContact,
  IFeeData,
  ISvmKeyTransactionProposal,
  ITransactionEvents,
  ITransactionProposalType,
  IWallet,
  useContactsQuery,
  useDeleteTransactionProposalMutation,
  useTransactionSimulationQuery,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { useVerifyExecutionContext } from '../../../../provider/verify-execution';
import { EoaTransactionProposalOptionsSheet } from './options-sheet';
import { EoaTransactionProposalScreen } from './screen';

interface SvmKeyTransactionProposalQueryProps {
  signer: ISignerWallet;
  transaction: ISvmKeyTransactionProposal;
  wallets: IWallet[];
  onDelete: VoidFunction;
}

export function SvmKeyTransactionProposalWithQuery(
  props: SvmKeyTransactionProposalQueryProps,
) {
  const { signer, transaction, wallets, onDelete } = props;
  const { verifyTransactionProposals, isVerifyingTransactionProposal } =
    useVerifyExecutionContext();

  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: signer.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Svm,
      ) as IContact[],
  );

  const deleteTransactionProposalMutation = useMutationEmitter(
    graphqlType.PendingTransaction,
    useDeleteTransactionProposalMutation(),
  );

  const handleDelete = async () => {
    await deleteTransactionProposalMutation.mutateAsync({
      input: {
        id: transaction.id,
        type: ITransactionProposalType.SvmKey,
      },
    });
    onDelete();
  };

  const simulatedEventsQuery = useTransactionSimulationQuery({
    input: {
      walletId: signer.id,
      chainId: ChainId.Solana,
      data: base58.decode(transaction.data!).toString('base64'),
      to: '',
      value: '',
    },
  });
  const simulatedEvents = loadDataFromQuery(
    simulatedEventsQuery,
    (data) => data.transactionSimulation as ITransactionEvents,
  );

  useEffect(() => {
    const taggedProposal = tagSvmKeyTransactionProposal(transaction);
    if (!isVerifyingTransactionProposal(taggedProposal)) {
      verifyTransactionProposals(taggedProposal);
    }
  }, [transaction]);

  const handleOptionsPress = () => setShowOptionsSheet(true);
  const handleCloseOptions = () => setShowOptionsSheet(false);

  return (
    <>
      <EoaTransactionProposalScreen
        signer={signer}
        wallets={wallets}
        contacts={contacts}
        feeData={makeLoadableError<IFeeData>()}
        gasLimit={makeLoadableError<bigint>()}
        balance={makeLoadableError<bigint>()}
        simulatedEvents={simulatedEvents}
        transaction={transaction}
        onChangeGasData={() => {}}
        onDelete={handleDelete}
        onOptionsPress={handleOptionsPress}
        onSubmit={() => {}}
      />
      <EoaTransactionProposalOptionsSheet
        isShowing={showOptionsSheet}
        onClose={handleCloseOptions}
      />
    </>
  );
}
