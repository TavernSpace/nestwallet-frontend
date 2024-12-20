import { useState } from 'react';
import {
  ExternalTransactionProposal,
  ISignerWallet,
  Loadable,
} from '../../../../common/types';
import { parseOrigin } from '../../../../common/utils/origin';
import { Alert } from '../../../../components/alert';
import { WarningBanner } from '../../../../components/banner/warning';
import { BaseButton } from '../../../../components/button/base-button';
import { TextButton } from '../../../../components/button/text-button';
import { ScrollView } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { parseError } from '../../../../features/errors';
import { getFeeMultiplier } from '../../../../features/proposal/fee';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { isValidSigner } from '../../../../features/wallet/utils';
import {
  IBlockchainType,
  IContact,
  IEthKeyTransactionProposal,
  IFeeData,
  ITransactionEvents,
  ITransactionMetaType,
  ITransactionStatus,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { GasSection } from '../../../../molecules/gas/selector';
import {
  BridgeProgressCard,
  GeneralInfoCard,
  WalletChangeCard,
} from '../../../../molecules/transaction/card';
import { useLanguageContext } from '../../../../provider/language';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { ExecutionBanner } from '../../banner';
import { localization } from './localization';

interface EoaTransactionProposalScreenProps {
  transaction: ExternalTransactionProposal;
  signer: ISignerWallet;
  wallets: IWallet[];
  balance: Loadable<bigint>;
  simulatedEvents: Loadable<ITransactionEvents>;
  contacts: Loadable<IContact[]>;
  gasLimit: Loadable<bigint>;
  feeData: Loadable<IFeeData>;
  onDelete: (proposal: ExternalTransactionProposal) => Promise<void>;
  onChangeGasData: (gasLevel: GasPriceLevel, gasLimits: bigint[]) => void;
  onSubmit: (proposal: IEthKeyTransactionProposal) => void;
  onOptionsPress: VoidFunction;
}

export function EoaTransactionProposalScreen(
  props: EoaTransactionProposalScreenProps,
) {
  const {
    transaction,
    signer,
    wallets,
    balance,
    simulatedEvents,
    contacts,
    gasLimit,
    feeData,
    onSubmit,
    onChangeGasData,
    onDelete,
    onOptionsPress,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [deleteAlertToggle, setDeleteAlertToggle] = useState(false);
  const [missingGas, setMissingGas] = useState(false);

  const origin = parseOrigin(transaction);
  const isSignable = isValidSigner(signer);
  const bridgeMetadata = transaction?.metadata?.find(
    (data) => data.type === ITransactionMetaType.Bridge,
  )?.bridge;
  const isBridge =
    transaction.status === ITransactionStatus.Confirmed &&
    !!transaction.bridgeStatus;

  const handleDeleteCancel = () => {
    setDeleteAlertToggle(false);
  };

  const handleDeletePress = () => {
    setDeleteAlertToggle(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(transaction);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: isBridge
          ? localization.deletedTransaction[language]
          : localization.dismissedTransaction[language],
      });
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    } finally {
      setDeleteAlertToggle(!deleteAlertToggle);
    }
  };

  const handleMissingGas = (missingGas: boolean) => {
    setMissingGas(missingGas);
  };

  const canSubmit =
    transaction.status === ITransactionStatus.Unsigned ||
    transaction.status === ITransactionStatus.Pending ||
    transaction.status === ITransactionStatus.Dropped;

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex h-full w-full flex-col space-y-1'>
            <View className='flex flex-col space-y-1.5 px-4'>
              {!isSignable &&
                transaction.status === ITransactionStatus.Unsigned && (
                  <WarningBanner
                    title={localization.missingImport[language]}
                    subtitle={localization.viewOnlyWalletDescription[language]}
                  />
                )}
              {transaction.status !== ITransactionStatus.Unsigned && (
                <BaseButton
                  className='overflow-hidden rounded-full'
                  onPress={onOptionsPress}
                >
                  <ExecutionBanner
                    isExecuting={
                      transaction.status === ITransactionStatus.Pending
                    }
                    isFailed={false}
                    isReverted={
                      transaction.status === ITransactionStatus.Failed
                    }
                    isExecuted={
                      transaction.status === ITransactionStatus.Confirmed
                    }
                    isDropped={
                      transaction.status === ITransactionStatus.Dropped
                    }
                    isReplaced={
                      transaction.status === ITransactionStatus.Replaced
                    }
                  />
                </BaseButton>
              )}
            </View>
            <View className='flex flex-col space-y-3 pt-2'>
              <GeneralInfoCard
                className='mx-4'
                origin={origin}
                type='proposal'
                wallet={transaction.wallet}
                chainId={transaction.chainId}
                endDate={transaction.submittedAt ?? undefined}
              />
              <WalletChangeCard
                className='mx-4'
                wallet={transaction.wallet}
                chainId={transaction.chainId}
                type='proposal'
                events={simulatedEvents}
                wallets={wallets}
                contacts={contacts.data ?? []}
                isComplete={transaction.status === ITransactionStatus.Confirmed}
              />
              {(!!transaction.bridgeData || !!bridgeMetadata) &&
                !!transaction.bridgeStatus && (
                  <BridgeProgressCard
                    className='mx-4'
                    wallet={transaction.wallet}
                    chainId={transaction.chainId}
                    type='proposal'
                    failed={
                      transaction.status === ITransactionStatus.Dropped ||
                      transaction.status === ITransactionStatus.Failed ||
                      transaction.status === ITransactionStatus.Replaced ||
                      transaction.status === ITransactionStatus.Unsigned
                    }
                    wallets={wallets}
                    contacts={contacts.data ?? []}
                    bridgeData={
                      bridgeMetadata
                        ? {
                            legacy: false,
                            bridgeStatus: transaction.bridgeStatus,
                            bridgeData: bridgeMetadata,
                          }
                        : {
                            legacy: true,
                            bridgeStatus: transaction.bridgeStatus,
                            bridgeData: transaction.bridgeData!,
                          }
                    }
                  />
                )}
            </View>
          </View>
        </ScrollView>
        {canSubmit && (
          <View className='flex flex-col space-y-2 px-4 pt-2'>
            {transaction.wallet.blockchain === IBlockchainType.Evm && (
              <GasSection
                hasBackground={true}
                chainId={transaction.chainId}
                feeData={feeData}
                gasLimit={gasLimit}
                balance={balance}
                gasMultiplier={getFeeMultiplier(transaction.data)}
                sendAmount={(transaction as IEthKeyTransactionProposal).value}
                onChange={onChangeGasData}
                onMissingGas={handleMissingGas}
              />
            )}
            <View className='flex flex-row justify-between space-x-4'>
              <View className='flex-1'>
                <TextButton
                  onPress={handleDeletePress}
                  type={
                    transaction.wallet.blockchain === IBlockchainType.Evm
                      ? 'tertiary'
                      : 'primary'
                  }
                  text={localization.delete[language]}
                  disabled={
                    transaction.status !== ITransactionStatus.Unsigned &&
                    transaction.status !== ITransactionStatus.Dropped
                  }
                />
              </View>
              {transaction.wallet.blockchain === IBlockchainType.Evm && (
                <View className='flex-1'>
                  <TextButton
                    onPress={() =>
                      onSubmit(transaction as IEthKeyTransactionProposal)
                    }
                    text={
                      transaction.status === ITransactionStatus.Unsigned
                        ? localization.execute[language]
                        : ITransactionStatus.Pending
                        ? localization.replace[language]
                        : localization.retry[language]
                    }
                    disabled={
                      !isSignable ||
                      !feeData.success ||
                      !gasLimit.success ||
                      missingGas
                    }
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ViewWithInset>
      <Alert
        title={localization.deleteTransaction[language]}
        subtitle={localization.confirmDeleteTransaction[language]}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isVisible={deleteAlertToggle}
      />
    </View>
  );
}
