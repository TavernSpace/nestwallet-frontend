import {
  IApproveTransactionInput,
  ISignerWallet,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IContact,
  ITransactionEvents,
  ITransactionProposal,
  IWallet,
  useContactsQuery,
  useTransactionSimulationsQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ExecutionSheet } from '@nestwallet/app/screens/proposal/execution-sheet';
import base58 from 'bs58';
import { useState } from 'react';
import { loadDataFromQuery } from '../../../../common/utils/query';
import { ChainId } from '../../../../features/chain';
import { useCreateAndExecuteSvmTransaction } from '../../../../features/svm/transaction/execute';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { ConnectionType } from '../../types';
import { ApprovalSvmTransactionView } from './view';

interface ApprovalSvmTransactionWithQueryProps {
  isInternal?: boolean;
  transactionParams: IApproveTransactionInput;
  wallet: ISignerWallet;
  wallets: IWallet[];
  client: IProtectedWalletClient;
  connectionType: ConnectionType;
  onCancel: VoidPromiseFunction;
  onCompleted: VoidFunction;
  onTransactionProposalCreated: (
    proposal: ITransactionProposal[],
  ) => Promise<void>;
}

export function ApprovalSvmTransactionWithQuery(
  props: ApprovalSvmTransactionWithQueryProps,
) {
  const {
    transactionParams,
    wallet,
    wallets,
    client,
    connectionType,
    onCancel,
    onCompleted,
    onTransactionProposalCreated,
  } = props;
  const { origin, txs } = transactionParams;

  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const chainId = ChainId.Solana;

  const { signTransaction } = useCreateAndExecuteSvmTransaction(client, wallet);

  const handleExecute = async (): Promise<string | undefined> => {
    const proposals = await Promise.all(
      txs.map((tx) => signTransaction({ data: tx, origin, metadata: [] })),
    );
    const txHash = proposals[0]!.svmKey!.txHash!;
    await onTransactionProposalCreated(proposals);
    return txHash;
  };

  const simulatedEventsQuery = useTransactionSimulationsQuery({
    input: txs.map((tx) => ({
      walletId: wallet.id,
      chainId,
      data: base58.decode(tx).toString('base64'),
      to: '',
      value: '',
    })),
  });
  const simulatedEvents = loadDataFromQuery(
    simulatedEventsQuery,
    (data) => data.transactionSimulations as ITransactionEvents,
  );

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
        (contact) => contact.blockchain === IBlockchainType.Svm,
      ) as IContact[],
  );

  return (
    <>
      <ApprovalSvmTransactionView
        origin={origin}
        wallet={wallet}
        wallets={wallets}
        contacts={contacts}
        chainId={chainId}
        connectionType={connectionType}
        simulatedEvents={simulatedEvents}
        missingKeyring={!wallet.hasKeyring}
        onCancel={onCancel}
        onExecute={() => setShowExecutionSheet(true)}
      />
      <ExecutionSheet
        chainId={chainId}
        blockchain={wallet.blockchain}
        executor={wallet}
        isShowing={showExecutionSheet}
        onClose={() => setShowExecutionSheet(false)}
        onCompleted={onCompleted}
        onExecute={handleExecute}
      />
    </>
  );
}
