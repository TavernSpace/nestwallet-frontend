import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { useEffect, useState } from 'react';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { ISignerWallet } from '../../../../common/types';
import { discard, empty, retry } from '../../../../common/utils/functions';
import { loadDataFromQuery, mapLoadable } from '../../../../common/utils/query';
import { useExecuteEthKeyTransactionProposal } from '../../../../features/evm/transaction/execute';
import { usePreTransactionQueries } from '../../../../features/evm/transaction/gas';
import { TrezorAction } from '../../../../features/keyring/trezor/types';
import {
  getTrezorRequestPayload,
  shouldOpenTab,
} from '../../../../features/keyring/trezor/utils';
import { getTransactionOptions } from '../../../../features/proposal/gas';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { tagEthKeyTransactionProposal } from '../../../../features/proposal/utils';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import {
  IBlockchainType,
  IContact,
  IEthKeyTransactionProposal,
  ITransactionProposalType,
  ITransactionStatus,
  IWallet,
  useContactsQuery,
  useDeleteTransactionProposalMutation,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { WindowType } from '../../../../provider/nestwallet';
import { useVerifyExecutionContext } from '../../../../provider/verify-execution';
import { ExecutionSheet } from '../../execution-sheet';
import { EoaTransactionProposalOptionsSheet } from './options-sheet';
import { EoaTransactionProposalScreen } from './screen';

interface EthKeyTransactionProposalQueryProps {
  signer: ISignerWallet;
  transaction: IEthKeyTransactionProposal;
  wallets: IWallet[];
  windowType?: WindowType;
  client: IProtectedWalletClient;
  onDelete: VoidFunction;
  onTrezorRequest?: (payload: object) => void;
}

export function EthKeyTransactionProposalWithQuery(
  props: EthKeyTransactionProposalQueryProps,
) {
  const {
    signer,
    transaction,
    wallets,
    windowType = WindowType.none,
    client,
    onDelete,
    onTrezorRequest = empty,
  } = props;
  const { verifyTransactionProposals, isVerifyingTransactionProposal } =
    useVerifyExecutionContext();

  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [transactionOptions, setTransactionOptions] =
    useState<TransactionOptions>();

  const executeEthKeyTransactionProposalMutation =
    useExecuteEthKeyTransactionProposal();
  const deleteTransactionProposalMutation = useMutationEmitter(
    graphqlType.PendingTransaction,
    useDeleteTransactionProposalMutation(),
  );

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
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const isComplete =
    transaction.status === ITransactionStatus.Confirmed ||
    transaction.status === ITransactionStatus.Failed ||
    transaction.status === ITransactionStatus.Replaced;
  const { executor, feeData, gasLimit, simulatedEvents } =
    usePreTransactionQueries(
      signer,
      {
        chainId: transaction.chainId,
        data: transaction.data ?? '0x',
        to: transaction.toAddress,
        value: transaction.value,
      },
      { enabled: !isComplete },
    );

  useEffect(() => {
    const taggedProposal = tagEthKeyTransactionProposal(transaction);
    if (!isVerifyingTransactionProposal(taggedProposal)) {
      verifyTransactionProposals(taggedProposal);
    }
  }, [transaction]);

  const handleOptionsPress = () => setShowOptionsSheet(true);
  const handleCloseOptions = () => setShowOptionsSheet(false);

  const handleChangeGasData = (
    gasLevel: GasPriceLevel,
    gasLimits: bigint[],
  ) => {
    if (gasLimits.length !== 1) return;
    setTransactionOptions(getTransactionOptions(gasLimits[0]!, gasLevel));
  };

  const handleDelete = async () => {
    await deleteTransactionProposalMutation.mutateAsync({
      input: {
        id: transaction.id,
        type: ITransactionProposalType.EthKey,
      },
    });
    onDelete();
  };

  const handleExecute = async (): Promise<string | undefined> => {
    if (!transactionOptions) return;
    // TODO: how should we handle replacements when the user has multiple pending tx?
    const isReplacement = transaction.status !== ITransactionStatus.Unsigned;
    const etherSigner = await client.getEvmSigner(
      transaction.chainId,
      signer,
      true,
      transaction.isPrivate ?? false,
    );
    const nonce = await etherSigner.getNonce(
      isReplacement ? 'latest' : 'pending',
    );
    const txResponse = await etherSigner.sendTransaction({
      ...transactionOptions,
      data: transaction.data ?? '0x',
      from: signer.address,
      to: transaction.toAddress,
      value: transaction.value,
      type: transactionOptions.gasPrice ? 0 : 2,
      chainId: transaction.chainId,
      nonce,
    });
    await retry(() =>
      executeEthKeyTransactionProposalMutation.mutateAsync(
        transaction,
        txResponse,
      ),
    ).catch(discard);
    return txResponse.hash;
  };

  const handleSubmit = () => {
    const requiresNewTab = shouldOpenTab(windowType, signer);
    if (!requiresNewTab) {
      setShowExecutionSheet(true);
    } else if (transactionOptions) {
      const isReplacement = transaction.status !== ITransactionStatus.Unsigned;
      onTrezorRequest(
        getTrezorRequestPayload(signer, {
          type: TrezorAction.EthKeyTxExecute,
          proposal: transaction,
          transactionOptions,
          replacement: isReplacement,
        }),
      );
    }
  };

  return (
    <>
      <EoaTransactionProposalScreen
        signer={signer}
        wallets={wallets}
        contacts={contacts}
        feeData={feeData}
        gasLimit={gasLimit}
        balance={mapLoadable(executor!.balance)((data) => BigInt(data))}
        simulatedEvents={simulatedEvents}
        transaction={transaction}
        onChangeGasData={handleChangeGasData}
        onDelete={handleDelete}
        onOptionsPress={handleOptionsPress}
        onSubmit={handleSubmit}
      />
      {transactionOptions && (
        <ExecutionSheet
          chainId={transaction.chainId}
          blockchain={IBlockchainType.Evm}
          executor={signer}
          isShowing={showExecutionSheet}
          onClose={() => setShowExecutionSheet(false)}
          onCompleted={() => setShowExecutionSheet(false)}
          onExecute={handleExecute}
        />
      )}
      <EoaTransactionProposalOptionsSheet
        isShowing={showOptionsSheet}
        onClose={handleCloseOptions}
      />
    </>
  );
}
