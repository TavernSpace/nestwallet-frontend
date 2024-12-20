import {
  IApproveTransactionInput,
  ISignerWallet,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import {
  IBlockchainType,
  IContact,
  ICreateTransactionProposalInput,
  ITransactionProposal,
  IWallet,
  IWalletType,
  useContactsQuery,
  useCreateTransactionProposalMutation,
  useInteractedAddressesQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ExecutionSheet } from '@nestwallet/app/screens/proposal/execution-sheet';
import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useQueryRefetcher } from '../../../../common/hooks/query';
import { loadDataFromQuery, mapLoadable } from '../../../../common/utils/query';
import { useCreateAndExecuteEthKeyTransaction } from '../../../../features/evm/transaction/execute';
import { usePreTransactionQueries } from '../../../../features/evm/transaction/gas';
import { getTransactionOptions } from '../../../../features/proposal/gas';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { graphqlType } from '../../../../graphql/types';
import { ConnectionType } from '../../types';
import { ApprovalTransactionView } from './view';

interface ApprovalEvmTransactionWithQueryProps {
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

export function ApprovalEvmTransactionWithQuery(
  props: ApprovalEvmTransactionWithQueryProps,
) {
  const { transactionParams, wallet, wallets, client, connectionType } = props;
  const { origin, txs } = transactionParams;

  const [transactionOptions, setTransactionOptions] =
    useState<TransactionOptions>();
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);

  const createTransactionProposalMutation =
    useCreateTransactionProposalMutation();
  const { executeTransaction } = useCreateAndExecuteEthKeyTransaction(
    client,
    wallet,
  );

  const transaction = ethers.Transaction.from(txs[0]!);
  const chainId = wallet.chainId || Number(transaction.chainId);
  const transactionInput = {
    walletId: wallet.id,
    chainId: chainId,
    from: wallet.address,
    to: transaction.to!,
    data: transaction.data,
    value: ethers.toBeHex(transaction.value),
  };
  const isSafe = wallet.type === IWalletType.Safe;

  const { executor, feeData, gasLimit, simulatedEvents } =
    usePreTransactionQueries(wallet, transactionInput, { enabled: !isSafe });

  const interactionsQuery = useQueryRefetcher(
    [graphqlType.Proposal, graphqlType.PendingTransaction],
    useInteractedAddressesQuery(
      {
        input: {
          addresses: [transactionInput.to],
          chainId,
        },
      },
      { staleTime: 1000 * 60 },
    ),
  );
  const interaction = loadDataFromQuery(
    interactionsQuery,
    (data) => data.interactedAddresses[0]!,
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
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const handleChangeGasData = (
    gasLevel: GasPriceLevel,
    gasLimits: bigint[],
  ) => {
    if (gasLimits.length !== 1) return;
    setTransactionOptions(getTransactionOptions(gasLimits[0]!, gasLevel));
  };

  const handleExecute = async (): Promise<string | undefined> => {
    if (!transactionOptions) {
      return;
    }
    const proposal = await executeTransaction({
      transaction: transactionInput,
      transactionOptions,
      origin,
      interactedAddresses: [
        {
          address: ethers.getAddress(transactionInput.to),
          chainId: transactionInput.chainId,
          sendCount: 0,
          interactionCount: 1,
        },
      ],
      metadata: [],
    });
    const txHash = proposal.ethKey!.txHash!;
    await props.onTransactionProposalCreated(proposal);
    return txHash;
  };

  const handleSubmit = async (input: ICreateTransactionProposalInput) => {
    if (wallet.type === IWalletType.Safe) {
      const newProposal = await createTransactionProposalMutation.mutateAsync({
        input,
      });
      props.onTransactionProposalCreated(
        newProposal.createTransactionProposal as ITransactionProposal,
      );
    } else {
      setShowExecutionSheet(true);
    }
  };

  return (
    <>
      <ApprovalTransactionView
        origin={origin}
        wallet={wallet}
        wallets={wallets}
        contacts={contacts}
        chainId={chainId}
        connectionType={connectionType}
        transaction={transactionInput}
        simulatedEvents={simulatedEvents}
        interaction={interaction}
        gasLimit={gasLimit}
        feeData={feeData}
        balance={mapLoadable(executor!.balance)((data) => BigInt(data))}
        missingKeyring={!isSafe && !wallet.hasKeyring}
        onCancel={props.onCancel}
        onSubmit={handleSubmit}
        onChangeGasData={handleChangeGasData}
      />
      {!isSafe && transactionOptions && (
        <ExecutionSheet
          chainId={transactionInput.chainId}
          blockchain={wallet.blockchain}
          executor={wallet}
          isShowing={showExecutionSheet}
          onClose={() => setShowExecutionSheet(false)}
          onCompleted={props.onCompleted}
          onExecute={handleExecute}
        />
      )}
    </>
  );
}
