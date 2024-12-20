import { faBolt } from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Platform } from 'react-native';
import { Loadable, Origin, TransactionData } from '../../../../common/types';
import { omit, withHttps } from '../../../../common/utils/functions';
import { convertWalletTypeToLabel } from '../../../../common/utils/types';
import { WarningBanner } from '../../../../components/banner/warning';
import { TextButton } from '../../../../components/button/text-button';
import { ScrollView } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { getFeeMultiplier } from '../../../../features/proposal/fee';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { walletTransactionProposalType } from '../../../../features/proposal/utils';
import { isHardwareWallet } from '../../../../features/wallet/utils';
import {
  IContact,
  ICreateTransactionProposalInput,
  IFeeData,
  IInteractedAddress,
  ITransactionEvents,
  ITransactionProposalType,
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '../../../../graphql/client/generated/graphql';
import { GasSection } from '../../../../molecules/gas/selector';
import {
  GeneralInfoCard,
  WalletChangeCard,
} from '../../../../molecules/transaction/card';
import { useLanguageContext } from '../../../../provider/language';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { RequestHeader } from '../../header';
import { ConnectionType } from '../../types';
import { localization } from '../localization';
import { CreateProposalInputSchema } from './schema';

interface TransactionProposalCreationInput {
  chainId: number;
  toAddress: string;
  value: string;
  data?: string;
  relay: boolean;
  description: string;
  originName?: string;
  originImageURL?: string;
  originURL?: string;
}

interface ApprovalTransactionViewProps {
  origin?: Origin;
  wallet: IWallet;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
  chainId: number;
  missingKeyring: boolean;
  transaction: TransactionData;
  simulatedEvents: Loadable<ITransactionEvents>;
  interaction: Loadable<IInteractedAddress>;
  balance: Loadable<bigint>;
  gasLimit: Loadable<bigint>;
  feeData: Loadable<IFeeData>;
  connectionType: ConnectionType;
  onCancel: VoidFunction;
  onSubmit: (
    value: ICreateTransactionProposalInput,
  ) => Promise<void> | undefined;
  onChangeGasData: (gasLevel: GasPriceLevel, gasLimits: bigint[]) => void;
}

export function ApprovalTransactionView(props: ApprovalTransactionViewProps) {
  const {
    origin,
    wallet,
    wallets,
    contacts,
    chainId,
    missingKeyring,
    transaction,
    gasLimit,
    feeData,
    balance,
    simulatedEvents,
    interaction,
    connectionType,
    onSubmit,
    onCancel,
    onChangeGasData,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [missingGas, setMissingGas] = useState(false);

  const isSafe = wallet.type === IWalletType.Safe;
  const isWalletDeployed =
    !isSafe || wallet.deploymentStatus === IWalletDeploymentStatus.Deployed;
  const isMobileHardware = isHardwareWallet(wallet) && Platform.OS !== 'web';
  const viewOnlyWallet =
    missingKeyring || isMobileHardware || !isWalletDeployed;
  const isDisabled =
    (!isSafe && (missingGas || !gasLimit.success || !feeData.success)) ||
    viewOnlyWallet;

  const handleMissingGas = (missingGas: boolean) => {
    setMissingGas(missingGas);
  };

  const handleSubmit = async (input: TransactionProposalCreationInput) => {
    try {
      const transactionProposalType = walletTransactionProposalType(wallet);
      const parsedInput: ICreateTransactionProposalInput = {
        type: transactionProposalType,
        safe:
          transactionProposalType === ITransactionProposalType.Safe
            ? { ...input, walletId: wallet.id }
            : undefined,
        ethKey:
          transactionProposalType === ITransactionProposalType.EthKey
            ? omit({ ...input, walletId: wallet.id }, 'description', 'relay')
            : undefined,
      };
      await onSubmit(parsedInput);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorMessage[language],
      });
    }
  };

  const formik = useFormik<TransactionProposalCreationInput>({
    initialValues: {
      chainId,
      toAddress: transaction.to,
      value: transaction.value,
      data: transaction.data,
      originName: origin?.title,
      originImageURL: origin?.favIconUrl,
      originURL: origin?.url,
      description: origin?.url
        ? localization.initialDescriptionKnownURL(
            new URL(withHttps(origin.url)).hostname,
          )[language]
        : localization.initialDescriptionUnknownURL[language],
      relay: false,
    },
    validationSchema: CreateProposalInputSchema,
    onSubmit: handleSubmit,
  });

  return (
    <View className='bg-background absolute h-full w-full'>
      <ViewWithInset
        className='flex h-full w-full flex-col'
        hasBottomInset={true}
      >
        <RequestHeader
          origin={origin}
          connectionType={connectionType}
          icon={faBolt}
          text={localization.transactionRequest[language]}
        />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex flex-col space-y-3 px-4 pt-3'>
            {viewOnlyWallet && (
              <WarningBanner
                title={
                  isMobileHardware
                    ? localization.viewOnly(
                        convertWalletTypeToLabel(wallet.type),
                      )[language]
                    : !isWalletDeployed
                    ? localization.inactiveSafe[language]
                    : localization.missingImport[language]
                }
                body={
                  isMobileHardware
                    ? localization.mobileHardwareWarning[language]
                    : !isWalletDeployed
                    ? localization.safeNotDeployedWarning[language]
                    : localization.importedOnAnotherDeviceWarning[language]
                }
              />
            )}
            <GeneralInfoCard
              type='proposal'
              wallet={wallet}
              chainId={chainId}
              interaction={interaction}
              initialCollapsed={false}
            />
            <WalletChangeCard
              wallet={wallet}
              wallets={wallets}
              contacts={contacts.data ?? []}
              chainId={chainId}
              type='proposal'
              events={simulatedEvents}
              isComplete={false}
            />
          </View>
        </ScrollView>
        <View className='flex flex-col space-y-2 px-4 pt-2'>
          {!isSafe && !viewOnlyWallet && (
            <GasSection
              hasBackground={true}
              chainId={chainId}
              feeData={feeData}
              gasLimit={gasLimit}
              balance={balance}
              gasMultiplier={getFeeMultiplier(transaction.data)}
              sendAmount={transaction.value}
              onChange={onChangeGasData}
              onMissingGas={handleMissingGas}
            />
          )}
          <View className='flex flex-row items-center justify-between space-x-4'>
            <TextButton
              className='flex-1'
              onPress={onCancel}
              type='tertiary'
              text={localization.cancel[language]}
              disabled={formik.isSubmitting}
            />
            <TextButton
              className='flex-1'
              onPress={formik.submitForm}
              loading={formik.isSubmitting}
              disabled={formik.isSubmitting || isDisabled}
              text={localization.confirm[language]}
            />
          </View>
        </View>
      </ViewWithInset>
    </View>
  );
}
