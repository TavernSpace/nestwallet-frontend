import { SafeInfoResponse } from '@safe-global/api-kit';
import _ from 'lodash';
import { useState } from 'react';
import { useCopy } from '../../../../common/hooks/copy';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
  Loadable,
  SafeNonceData,
  SafeTransactionProposalWithNonce,
  VoidPromiseFunction,
} from '../../../../common/types';
import { parseOrigin } from '../../../../common/utils/origin';
import { mapLoadable } from '../../../../common/utils/query';
import { Alert } from '../../../../components/alert';
import { BaseButton } from '../../../../components/button/base-button';
import { TextButton } from '../../../../components/button/text-button';
import { Field } from '../../../../components/field/field';
import { ScrollView } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { parseError } from '../../../../features/errors';
import { defaultGasMultiplier } from '../../../../features/proposal/fee';
import { isRejectionSafeTransactionProposal } from '../../../../features/proposal/nonce';
import {
  useLoadExecutorBalances,
  useWithExecutor,
  useWithSafeSigner,
} from '../../../../features/proposal/signer';
import { GasPriceLevel } from '../../../../features/proposal/types';
import {
  SafeTxState,
  getSafeTxStateFromSafeTransactionProposal,
  safeTxStateToAction,
  validateSignatures,
} from '../../../../features/safe/utils';
import {
  IContact,
  IFeeData,
  IProposalState,
  ISafeTransactionProposal,
  ITransactionEvents,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { GasSection } from '../../../../molecules/gas/selector';
import {
  GeneralInfoCard,
  SafeInfoCard,
  WalletChangeCard,
} from '../../../../molecules/transaction/card';
import { ConfirmedSafeSignersSection } from '../../../../molecules/transaction/signer/section';
import { useLanguageContext } from '../../../../provider/language';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { ExecutionBanner } from '../../banner';
import { EditSafeNonceSheet } from './edit-nonce-sheet';
import { localization } from './localization';
import { SafeTransactionProposalWarnings } from './warning';

interface SafeTransactionProposalViewProps {
  proposal: ISafeTransactionProposal;
  signer?: ISignerWallet;
  executor?: ISignerWallet;
  signers: ISignerWallet[];
  isDapp: boolean;
  executors: IWalletWithLoadableBalance[];
  safeInfo: SafeInfoResponse;
  nonceData: SafeNonceData;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
  simulatedEvents: Loadable<ITransactionEvents>;
  gasLimit: Loadable<bigint>;
  feeData: Loadable<IFeeData>;
  onApprove: (
    safeInfo: SafeInfoResponse,
    proposal: SafeTransactionProposalWithNonce,
  ) => Promise<void>;
  onReject: VoidFunction;
  onDelete: VoidPromiseFunction;
  onUpdateNonce: (nonce: number) => Promise<void>;
  onSelectSigner: (signer: ISignerWallet | undefined) => void;
  onSelectExecutor: (executor: ISignerWallet) => void;
  onChangeGasData: (gasLevel: GasPriceLevel, gasLimits: bigint[]) => void;
  onOptionsPress: VoidFunction;
  onSelectSignerPress: VoidFunction;
  onSelectExecutorPress: VoidFunction;
}

export function SafeTransactionProposalView(
  props: SafeTransactionProposalViewProps,
) {
  const {
    proposal,
    signer,
    executor,
    isDapp,
    contacts,
    signers,
    executors,
    wallets,
    safeInfo,
    nonceData,
    simulatedEvents,
    gasLimit,
    feeData,
    onApprove,
    onReject,
    onDelete,
    onChangeGasData,
    onUpdateNonce,
    onSelectSigner,
    onSelectExecutor,
    onOptionsPress,
    onSelectSignerPress,
    onSelectExecutorPress,
  } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();
  const { copy: copySigner } = useCopy(
    localization.copiedSignerAddress[language],
  );

  const [deleteAlertToggle, setDeleteAlertToggle] = useState(false);
  const [editNonceToggle, setEditNonceToggle] = useState(false);
  const [missingGas, setMissingGas] = useState(false);

  const proposalState = getSafeTxStateFromSafeTransactionProposal(
    safeInfo,
    proposal,
  );
  const isExecuted = proposalState === SafeTxState.Executed;
  const isExecuting = proposalState === SafeTxState.Executing;
  const isFailed = proposalState === SafeTxState.Failed;
  const isReverted = proposal.reverted;
  const isExecutable =
    isExecuting || proposalState === SafeTxState.ReadyToExecute;
  const isReplaced =
    !(isExecuted || isFailed) &&
    (proposal.state === IProposalState.Invalid ||
      (!_.isNil(proposal.safeNonce) && proposal.safeNonce < safeInfo.nonce));
  const requiresSignature =
    proposalState === SafeTxState.NotCreated ||
    proposalState === SafeTxState.MissingSignature;
  const isComplete = isExecuted || isFailed;
  const origin = parseOrigin(proposal);
  const safeNonce = proposal.safeNonce ?? nonceData.latestNonce + 1;
  const validSignatures = validateSignatures(
    proposal.confirmations.map((conf) => conf.signer),
    safeInfo.owners,
  );
  const hasSelectedSigned = signer && validSignatures.includes(signer.address);
  const executorWithBalance = executors.find(
    (exe) => exe.wallet.id === executor?.id,
  );

  // TODO: if the user changes the nonce this will fire again and reselect another signer
  useWithSafeSigner(proposal, safeInfo, signers, onSelectSigner);
  useWithExecutor(executor, executors, isExecutable, onSelectExecutor);

  const handleApprove = async () => {
    try {
      await onApprove(safeInfo, {
        ...proposal,
        safeNonce,
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleReject = () => {
    if (proposalState === SafeTxState.NotCreated) {
      setDeleteAlertToggle(!deleteAlertToggle);
    } else {
      onReject();
    }
  };

  const onDeleteCancel = () => {
    setDeleteAlertToggle(false);
  };

  const onDeleteConfirm = async () => {
    try {
      await onDelete();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyDeletedProposal[language],
      });
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
    setDeleteAlertToggle(!deleteAlertToggle);
  };

  const onEditNonceCancel = () => {
    setEditNonceToggle(false);
  };

  const onEditNonceConfirm = async (nonce: number) => {
    try {
      await onUpdateNonce(nonce);
      setEditNonceToggle(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyUpdatedNonce[language],
      });
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
  };

  const isProposalExpired =
    !_.isNil(proposal.safeNonce) && proposal.safeNonce < safeInfo.nonce;
  const isRejection = isRejectionSafeTransactionProposal(proposal);

  const loadingExecutors = useLoadExecutorBalances(executors);

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex h-full w-full flex-col space-y-1'>
            <View className='flex flex-col space-y-1.5'>
              {(isExecuted ||
                isExecuting ||
                isReverted ||
                isFailed ||
                isReplaced) && (
                <BaseButton
                  className='overflow-hidden rounded-full px-4'
                  onPress={onOptionsPress}
                >
                  <ExecutionBanner
                    isExecuted={isExecuted}
                    isExecuting={isExecuting}
                    isReverted={isReverted}
                    isFailed={isFailed}
                    isDropped={false}
                    isReplaced={isReplaced}
                  />
                </BaseButton>
              )}
              {!isReplaced && (
                <View>
                  <SafeTransactionProposalWarnings
                    proposal={proposal}
                    isExecuted={isExecuted}
                    isExecuting={isExecuting || isFailed}
                    nonces={nonceData.nonces}
                    safeInfo={safeInfo}
                    safeNonce={safeNonce}
                  />
                </View>
              )}
            </View>
            <View className='flex flex-col space-y-3 pt-2'>
              <GeneralInfoCard
                className='mx-4'
                origin={origin}
                type='proposal'
                wallet={proposal.wallet}
                chainId={proposal.chainId}
                startDate={proposal.createdAt}
              />
              <WalletChangeCard
                className='mx-4'
                wallet={proposal.wallet}
                chainId={proposal.chainId}
                type='proposal'
                events={simulatedEvents}
                rejectionNonce={isRejection ? proposal.safeNonce! : undefined}
                wallets={wallets}
                contacts={contacts.data ?? []}
                isComplete={isComplete}
                isReplaced={isReplaced}
              />
              <SafeInfoCard
                className='mx-4'
                safeInfo={safeInfo}
                signer={signer}
                executor={executor}
                executionState={
                  !isExecutable || safeNonce !== safeInfo.nonce
                    ? 'invalid'
                    : loadingExecutors.loading
                    ? 'loading'
                    : 'valid'
                }
                nonce={safeNonce}
                state={proposalState}
                validSignatures={validSignatures}
                onSignerPress={onSelectSignerPress}
                onExecutorPress={onSelectExecutorPress}
                onEditNonce={() => setEditNonceToggle(true)}
              />

              {isComplete && (
                <Field label={localization.signedBy[language]}>
                  <ConfirmedSafeSignersSection
                    wallets={signers}
                    contacts={contacts.data ?? []}
                    confirmations={proposal.confirmations}
                    onSignerPressed={copySigner}
                  />
                </Field>
              )}
            </View>
          </View>
        </ScrollView>
        {/* do not show buttons if transaction has been executed */}
        {(!isComplete || isDapp) && !isReplaced && (
          <View className='flex flex-col space-y-2 px-4 pt-2'>
            {isExecutable &&
              safeNonce === safeInfo.nonce &&
              executorWithBalance && (
                <GasSection
                  hasBackground={true}
                  chainId={proposal.chainId}
                  feeData={feeData}
                  gasLimit={gasLimit}
                  balance={mapLoadable(executorWithBalance.balance)((data) =>
                    BigInt(data),
                  )}
                  sendAmount='0x0'
                  gasMultiplier={defaultGasMultiplier}
                  onChange={onChangeGasData}
                  onMissingGas={setMissingGas}
                />
              )}
            <View className='flex flex-row justify-between space-x-4'>
              {!isComplete && (
                <View className='flex-1'>
                  <TextButton
                    disabled={isComplete}
                    onPress={handleReject}
                    type='tertiary'
                    text={
                      proposalState === SafeTxState.NotCreated
                        ? localization.delete[language]
                        : localization.reject[language]
                    }
                  />
                </View>
              )}
              <View className='flex-1'>
                <TextButton
                  // TODO: handle relay case
                  disabled={
                    !(isComplete && isDapp) &&
                    (isProposalExpired ||
                      ((!signer || hasSelectedSigned) && requiresSignature) ||
                      ((!executor ||
                        missingGas ||
                        !feeData.success ||
                        !gasLimit.success) &&
                        isExecutable))
                  }
                  onPress={handleApprove}
                  text={
                    isComplete && isDapp
                      ? localization.done[language]
                      : safeTxStateToAction(proposalState)
                  }
                />
              </View>
            </View>
          </View>
        )}
      </ViewWithInset>
      <Alert
        title={localization.deleteProposal[language]}
        subtitle={localization.confirmDeleteProposal[language]}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        isVisible={deleteAlertToggle}
      />
      <EditSafeNonceSheet
        safeNonce={safeInfo.nonce}
        latestNonce={nonceData.latestNonce}
        savedNonce={proposal.safeNonce ?? undefined}
        onCancel={onEditNonceCancel}
        onConfirm={onEditNonceConfirm}
        isVisible={editNonceToggle}
      />
    </View>
  );
}
