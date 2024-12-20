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
import { useState } from 'react';
import { loadDataFromQuery } from '../../../../common/utils/query';
import { ChainId } from '../../../../features/chain';
import {
  useCreateAndExecuteTvmTransaction,
  usePreparedBocQuery,
} from '../../../../features/tvm/transaction/execute';
import { TonMessage } from '../../../../features/tvm/types';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { ConnectionType } from '../../types';
import { ApprovalTvmTransactionView } from './view';

interface ApprovalTvmTransactionWithQueryProps {
  isInternal?: boolean;
  transactionParams: IApproveTransactionInput;
  wallet: ISignerWallet;
  wallets: IWallet[];
  client: IProtectedWalletClient;
  connectionType: ConnectionType;
  onCancel: VoidPromiseFunction;
  onCompleted: VoidFunction;
  onTransactionProposalCreated: (
    proposal: ITransactionProposal,
  ) => Promise<void>;
}

export function ApprovalTvmTransactionWithQuery(
  props: ApprovalTvmTransactionWithQueryProps,
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

  const { executeTransaction } = useCreateAndExecuteTvmTransaction(
    client,
    wallet,
  );

  const chainId = ChainId.Ton;
  const messages: TonMessage[] = txs.map((data) => {
    const message = JSON.parse(data);
    return {
      ...message,
      amount: BigInt(message.amount),
    };
  });

  const handleExecute = async (): Promise<string | undefined> => {
    const proposal = await executeTransaction({
      messages,
      origin,
      metadata: [],
    });
    const txHash = proposal!.tvmKey!.txHash!;
    await onTransactionProposalCreated(proposal);
    return txHash;
  };

  const preparedBocQuery = usePreparedBocQuery(client, wallet, messages);
  const preparedBoc = loadDataFromQuery(preparedBocQuery);

  const simulatedEventsQuery = useTransactionSimulationsQuery(
    {
      input: {
        walletId: wallet.id,
        chainId,
        data: preparedBoc.data!,
        to: wallet.address,
        value: '',
      },
    },
    { enabled: preparedBoc.success },
  );
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
        (contact) => contact.blockchain === IBlockchainType.Tvm,
      ) as IContact[],
  );

  return (
    <>
      <ApprovalTvmTransactionView
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
