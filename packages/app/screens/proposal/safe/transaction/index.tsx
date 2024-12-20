import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IDappData,
  ISignerWallet,
  IWalletWithLoadableBalance,
  SafeTransactionProposalWithNonce,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { getTransactionOptions } from '@nestwallet/app/features/proposal/gas';
import { GasPriceLevel } from '@nestwallet/app/features/proposal/types';
import {
  useConfirmSafeTransactionProposal,
  useExecuteSafeTransactionProposal,
} from '@nestwallet/app/features/safe/sign';
import {
  SafeTxState,
  createSafeWithProvider,
  getSafeTxStateFromSafeTransactionProposal,
} from '@nestwallet/app/features/safe/utils';
import {
  IBlockchainType,
  ICreateTransactionProposalInput,
  ISafeTransactionProposal,
  ITransactionProposalType,
  IWallet,
  useCreateTransactionProposalMutation,
  useDeleteTransactionProposalMutation,
  useUpdateTransactionProposalMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { ExecutionSheet } from '@nestwallet/app/screens/proposal/execution-sheet';
import { SafeSelectExecutorSheet } from '@nestwallet/app/screens/proposal/safe/select-executor-sheet';
import { SafeTransactionProposalOptionsSheet } from '@nestwallet/app/screens/proposal/safe/transaction/options-sheet';
import { SafeTransactionProposalWithQuery } from '@nestwallet/app/screens/proposal/safe/transaction/query';
import { SafeTransactionProposalRejectionSheet } from '@nestwallet/app/screens/proposal/safe/transaction/rejection-sheet';
import { SafeTransactionProposalSelectSignerSheet } from '@nestwallet/app/screens/proposal/safe/transaction/select-signer-sheet';
import { SafeTransactionProposalSigningSheet } from '@nestwallet/app/screens/proposal/safe/transaction/signing-sheet';
import { SafeInfoResponse } from '@safe-global/api-kit';
import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { useState } from 'react';
import { empty, id } from '../../../../common/utils/functions';
import { TrezorAction } from '../../../../features/keyring/trezor/types';
import {
  getTrezorRequestPayload,
  shouldOpenTab,
} from '../../../../features/keyring/trezor/utils';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { getValidSigners } from '../../../../features/wallet/utils';
import { useLanguageContext } from '../../../../provider/language';
import { WindowType } from '../../../../provider/nestwallet';
import { localization } from './localization';

interface ISafeTransactionProposalProps {
  dappData?: IDappData;
  proposal: ISafeTransactionProposal;
  executors: IWalletWithLoadableBalance[];
  signers: ISignerWallet[];
  wallets: IWallet[];
  windowType?: WindowType;
  walletService: IProtectedWalletClient;
  onApprove: (data: unknown) => Promise<void>;
  onClose: VoidFunction;
  onDeleted: VoidPromiseFunction;
  onProposalRejected: (rejectProposal: ISafeTransactionProposal) => void;
  onTrezorRequest?: (payload: object) => void;
}

export function SafeTransactionProposal(props: ISafeTransactionProposalProps) {
  const {
    dappData,
    proposal,
    executors,
    signers,
    wallets,
    walletService,
    windowType = WindowType.none,
    onApprove,
    onClose,
    onDeleted,
    onProposalRejected,
    onTrezorRequest = empty,
  } = props;
  const { language } = useLanguageContext();

  const [selectedSigner, setSelectedSigner] = useState<ISignerWallet>();
  const [selectedExecutor, setSelectedExecutor] = useState<ISignerWallet>();
  const [transactionOptions, setTransactionOptions] =
    useState<TransactionOptions>();

  const [showSelectSignerSheet, setShowSelectSignerSheet] = useState(false);
  const [showSelectExecutorSheet, setShowSelectExecutorSheet] = useState(false);
  const [showSigningSheet, setShowSigningSheet] = useState(false);
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [showRejectionSheet, setShowRejectionSheet] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  const updateTransactionProposalMutation = useMutationEmitter(
    [graphqlType.Proposal],
    useUpdateTransactionProposalMutation(),
  );
  const deleteTransactionProposalMutation = useMutationEmitter(
    [graphqlType.Proposal, graphqlType.Notification],
    useDeleteTransactionProposalMutation(),
  );
  const createTransactionProposalMutation = useMutationEmitter(
    [graphqlType.Proposal, graphqlType.Notification],
    useCreateTransactionProposalMutation(),
  );
  const confirmSafeTransactionProposalMutation =
    useConfirmSafeTransactionProposal();
  const executeSafeTransactionProposalMutation =
    useExecuteSafeTransactionProposal();

  const handleDelete = async () => {
    await deleteTransactionProposalMutation.mutateAsync({
      input: { id: proposal.id, type: ITransactionProposalType.Safe },
    });
    await onDeleted();
  };

  const handleUpdateNonce = async (nonce: number) => {
    await updateTransactionProposalMutation.mutateAsync({
      input: {
        id: proposal.id,
        type: ITransactionProposalType.Safe,
        safe: {
          nonce,
        },
      },
    });
  };

  const handleApprove = async (
    safeInfo: SafeInfoResponse,
    proposal: SafeTransactionProposalWithNonce,
  ) => {
    const safeTxState = getSafeTxStateFromSafeTransactionProposal(
      safeInfo,
      proposal,
    );
    const isExecutable =
      safeTxState === SafeTxState.ReadyToExecute ||
      safeTxState === SafeTxState.Executing;
    const isComplete =
      safeTxState === SafeTxState.Executed ||
      safeTxState === SafeTxState.Failed;

    if (isComplete && dappData) {
      await onApprove(proposal.txHash!);
    } else if (isExecutable) {
      if (!shouldOpenTab(windowType, selectedExecutor)) {
        setShowExecutionSheet(true);
      } else if (selectedExecutor && transactionOptions) {
        onTrezorRequest(
          getTrezorRequestPayload(selectedExecutor, {
            type: TrezorAction.SafeTxExecute,
            proposal,
            transactionOptions,
          }),
        );
      }
    } else {
      if (!shouldOpenTab(windowType, selectedSigner)) {
        setShowSigningSheet(true);
      } else if (selectedSigner) {
        onTrezorRequest(
          getTrezorRequestPayload(selectedSigner, {
            type: TrezorAction.SafeTxSign,
            proposal,
          }),
        );
      }
    }
  };

  const handleSign = async (
    proposal: SafeTransactionProposalWithNonce,
    signerWallet: ISignerWallet,
  ) => {
    const signer = await walletService.getEvmSigner(
      proposal.chainId,
      signerWallet,
    );
    const safe = await createSafeWithProvider(proposal.wallet, signer);
    await confirmSafeTransactionProposalMutation.mutateAsync(safe, proposal);
  };

  const handleExecute = async (): Promise<string | undefined> => {
    const executor = selectedExecutor!;
    const signer = await walletService.getEvmSigner(
      proposal.chainId,
      executor,
      true,
    );
    const safe = await createSafeWithProvider(proposal.wallet, signer);
    const result = await executeSafeTransactionProposalMutation.mutateAsync(
      safe,
      proposal as SafeTransactionProposalWithNonce,
      transactionOptions,
    );
    if (dappData) {
      await onApprove(result.executeTransactionProposal.safe!.txHash!).catch(
        id,
      );
      onClose();
    }
    return result.executeTransactionProposal.safe!.txHash ?? undefined;
  };

  const handleChangeGasData = (
    gasLevel: GasPriceLevel,
    gasLimits: bigint[],
  ) => {
    if (gasLimits.length !== 1) return;
    setTransactionOptions(getTransactionOptions(gasLimits[0]!, gasLevel));
  };

  /* Rejection Sheet functions */

  const handleReject = () => {
    setShowRejectionSheet(true);
  };

  const handleCloseRejection = () => {
    setShowRejectionSheet(false);
  };

  const handleSubmitRejection = async (proposal: ISafeTransactionProposal) => {
    const input: ICreateTransactionProposalInput = {
      type: ITransactionProposalType.Safe,
      safe: {
        chainId: proposal.wallet.chainId,
        walletId: proposal.wallet.id,
        description: localization.onChainRejectionForNonce(proposal.safeNonce)[
          language
        ],
        toAddress: proposal.wallet.address,
        value: '0x0',
        nonce: proposal.safeNonce,
      },
    };
    const rejectionProposal =
      await createTransactionProposalMutation.mutateAsync({
        input,
      });
    onProposalRejected(
      rejectionProposal.createTransactionProposal
        .safe as ISafeTransactionProposal,
    );
  };

  /* Options Sheet functions */

  const handleOptionsPress = () => {
    setShowOptionsSheet(true);
  };

  const handleCloseOptions = () => {
    setShowOptionsSheet(false);
  };

  const handleSelectSigner = (signer: ISignerWallet | undefined) => {
    setSelectedSigner(signer);
    setShowSelectSignerSheet(false);
  };

  const handleSelectExecutor = (executor: ISignerWallet) => {
    setSelectedExecutor(executor);
    setShowSelectExecutorSheet(false);
  };

  const handleSelectExecutorClose = () => {
    setShowSelectExecutorSheet(false);
  };

  const handleSelectExecutorPress = () => {
    setShowSelectExecutorSheet(true);
  };

  const handleSelectSignerPress = () => {
    setShowSelectSignerSheet(true);
  };

  const handleSelectSignerClose = () => {
    setShowSelectSignerSheet(false);
  };

  return (
    <>
      <SafeTransactionProposalWithQuery
        wallets={wallets}
        executor={selectedExecutor}
        signer={selectedSigner}
        signers={getValidSigners(signers, IBlockchainType.Evm)}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        onUpdateNonce={handleUpdateNonce}
        onSelectSigner={handleSelectSigner}
        onOptionsPress={handleOptionsPress}
        onSelectSignerPress={handleSelectSignerPress}
        onSelectExecutorPress={handleSelectExecutorPress}
        onSelectExecutor={handleSelectExecutor}
        onChangeGasData={handleChangeGasData}
      />
      <SafeTransactionProposalSelectSignerSheet
        signer={selectedSigner}
        signers={signers}
        isShowing={showSelectSignerSheet}
        onSelectSigner={handleSelectSigner}
        onClose={handleSelectSignerClose}
      />
      <SafeSelectExecutorSheet
        chainId={proposal.chainId}
        executors={executors}
        executor={selectedExecutor}
        isShowing={showSelectExecutorSheet}
        onSelectExecutor={handleSelectExecutor}
        onClose={handleSelectExecutorClose}
      />
      {selectedSigner && (
        <SafeTransactionProposalSigningSheet
          signer={selectedSigner}
          isShowing={showSigningSheet}
          onClose={() => setShowSigningSheet(false)}
          onSign={(tx) => handleSign(tx, selectedSigner)}
        />
      )}
      {selectedExecutor && transactionOptions && (
        <ExecutionSheet
          chainId={proposal.chainId}
          blockchain={IBlockchainType.Evm}
          executor={selectedExecutor}
          isShowing={showExecutionSheet}
          onExecute={handleExecute}
          onClose={() => setShowExecutionSheet(false)}
          onCompleted={onClose}
        />
      )}
      <SafeTransactionProposalRejectionSheet
        isShowing={showRejectionSheet}
        onClose={handleCloseRejection}
        onSubmit={handleSubmitRejection}
      />
      <SafeTransactionProposalOptionsSheet
        isShowing={showOptionsSheet}
        onClose={handleCloseOptions}
      />
    </>
  );
}
