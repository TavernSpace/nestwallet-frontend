import {
  faCircleExclamation,
  faSignature,
} from '@fortawesome/pro-solid-svg-icons';
import { useFormik } from 'formik';
import { Platform } from 'react-native';
import { Loadable, Origin } from '../../../common/types';
import { omit } from '../../../common/utils/functions';
import { onLoadable } from '../../../common/utils/query';
import { convertWalletTypeToLabel } from '../../../common/utils/types';
import { Banner } from '../../../components/banner';
import { WarningBanner } from '../../../components/banner/warning';
import { TextButton } from '../../../components/button/text-button';
import { ScrollView } from '../../../components/scroll';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { ChainId } from '../../../features/chain';
import { walletMessageProposalType } from '../../../features/proposal/utils';
import { isHardwareWallet } from '../../../features/wallet/utils';
import {
  IBlockchainType,
  ICreateMessageProposalInput,
  IMessageEvents,
  IMessageProposalType,
  IMessageType,
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import {
  GeneralInfoCard,
  MessageCard,
  WalletMessageChangeCard,
} from '../../../molecules/transaction/card';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { RequestHeader } from '../header';
import { ConnectionType } from '../types';
import { RiskBanner } from './evm/risk-banner';
import { CreateMessageProposalInputSchema } from './evm/schema';
import { localization } from './localization';

interface MessageProposalCreationInput {
  message: string;
  type: IMessageType;
  description: string;
  originName?: string;
  originImageURL?: string;
  originURL?: string;
}

interface ApprovalMessageViewProps {
  origin?: Origin;
  message: string;
  wallet: IWallet;
  missingKeyring: boolean;
  chainId: ChainId;
  simulatedEvents?: Loadable<IMessageEvents>;
  type: IMessageType;
  connectionType: ConnectionType;
  onCancel: VoidFunction;
  onSubmit: (input: ICreateMessageProposalInput) => Promise<void>;
}

export function ApprovalMessageView(props: ApprovalMessageViewProps) {
  const {
    origin,
    message,
    type,
    wallet,
    missingKeyring,
    chainId,
    simulatedEvents,
    connectionType,
    onCancel,
    onSubmit,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const isSafe = wallet.type === IWalletType.Safe;
  const isMobileHardware = isHardwareWallet(wallet) && Platform.OS !== 'web';
  const isWalletDeployed =
    !isSafe || wallet.deploymentStatus === IWalletDeploymentStatus.Deployed;
  const viewOnlyWallet =
    missingKeyring || isMobileHardware || !isWalletDeployed;
  const isUnsupported =
    wallet.blockchain === IBlockchainType.Svm &&
    wallet.type === IWalletType.Ledger;

  const handleSubmit = async (input: MessageProposalCreationInput) => {
    try {
      const messageProposalType = walletMessageProposalType(wallet);
      const parsedInput: ICreateMessageProposalInput = {
        type: messageProposalType,
        safe:
          messageProposalType === IMessageProposalType.Safe
            ? { ...input, walletId: wallet.id }
            : undefined,
        ethKey:
          messageProposalType === IMessageProposalType.EthKey
            ? omit({ ...input, walletId: wallet.id }, 'description')
            : undefined,
        svmKey:
          messageProposalType === IMessageProposalType.SvmKey
            ? omit({ ...input, walletId: wallet.id }, 'description')
            : undefined,
      };
      await onSubmit(parsedInput);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.error[language],
      });
    }
  };

  const formik = useFormik<MessageProposalCreationInput>({
    initialValues: {
      message,
      originName: origin?.title,
      originImageURL: origin?.favIconUrl,
      originURL: origin?.url,
      description: '',
      type,
    },
    validationSchema: CreateMessageProposalInputSchema,
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
          icon={faSignature}
          text={localization.signatureRequest[language]}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className='flex flex-col space-y-3 px-4 pt-3'>
            {(viewOnlyWallet || simulatedEvents || isUnsupported) && (
              <View className='flex flex-col space-y-1.5'>
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
                {!viewOnlyWallet && isUnsupported && (
                  <WarningBanner
                    title={localization.solanaLedger[language]}
                    body={localization.solanaLedgerBody[language]}
                  />
                )}
                {simulatedEvents &&
                  !viewOnlyWallet &&
                  !isUnsupported &&
                  onLoadable(simulatedEvents)(
                    () => (
                      <Banner
                        title={localization.verifyingMessage[language]}
                        icon={'loading'}
                        color={colors.primary}
                      />
                    ),
                    () => (
                      <Banner
                        title={localization.failedToVerify[language]}
                        icon={faCircleExclamation}
                        color={colors.failure}
                      />
                    ),
                    (simulatedEvents) =>
                      simulatedEvents.warnings.length > 0 ? (
                        <RiskBanner warnings={simulatedEvents.warnings} />
                      ) : null,
                  )}
              </View>
            )}
            <GeneralInfoCard
              type='proposal'
              wallet={wallet}
              chainId={chainId}
              initialCollapsed={false}
            />
            {simulatedEvents &&
              simulatedEvents.success &&
              simulatedEvents.data.nftApprovals.length +
                simulatedEvents.data.nftTransfers.length +
                simulatedEvents.data.tokenApprovals.length +
                simulatedEvents.data.tokenTransfers.length >
                0 && (
                <WalletMessageChangeCard
                  events={simulatedEvents}
                  wallet={wallet}
                  chainId={chainId}
                />
              )}
            <MessageCard message={message} messageType={type} type='proposal' />
          </View>
        </ScrollView>
        <View className='flex flex-row items-center justify-between space-x-4 px-4 pt-2'>
          <TextButton
            className='flex-1'
            onPress={onCancel}
            type='tertiary'
            disabled={formik.isSubmitting}
            text={localization.cancel[language]}
          />
          <TextButton
            className='flex-1'
            onPress={formik.submitForm}
            loading={formik.isSubmitting}
            text={localization.confirm[language]}
            disabled={formik.isSubmitting || viewOnlyWallet || isUnsupported}
          />
        </View>
      </ViewWithInset>
    </View>
  );
}
