import { SafeInfoResponse } from '@safe-global/api-kit';
import { useRef, useState } from 'react';
import { useCopy } from '../../../../common/hooks/copy';
import {
  ISignerWallet,
  Loadable,
  VoidPromiseFunction,
} from '../../../../common/types';
import { parseOrigin } from '../../../../common/utils/origin';
import { Alert } from '../../../../components/alert';
import { TextButton } from '../../../../components/button/text-button';
import { Field } from '../../../../components/field/field';
import { ScrollView } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { useWithSafeSigner } from '../../../../features/proposal/signer';
import { validateSignatures } from '../../../../features/safe/utils';
import {
  IContact,
  ISafeMessageProposal,
} from '../../../../graphql/client/generated/graphql';
import {
  GeneralInfoCard,
  MessageCard,
  SafeInfoCard,
} from '../../../../molecules/transaction/card';
import { ConfirmedSafeSignersSection } from '../../../../molecules/transaction/signer/section';
import { useLanguageContext } from '../../../../provider/language';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { localization } from './localization';

interface SafeMessageProposalViewProps {
  message: ISafeMessageProposal;
  signer?: ISignerWallet;
  safeInfo: SafeInfoResponse;
  contacts: Loadable<IContact[]>;
  signers: ISignerWallet[];
  isDapp: boolean;
  onReject: VoidPromiseFunction;
  onApprove: (
    safeInfo: SafeInfoResponse,
    message: ISafeMessageProposal,
  ) => Promise<void>;
  onDelete: (message: ISafeMessageProposal) => Promise<void>;
  onSelectSigner: (signer: ISignerWallet | undefined) => void;
  onSelectSignerPress: VoidFunction;
}

export function SafeMessageProposalView(props: SafeMessageProposalViewProps) {
  const {
    message,
    signer,
    safeInfo,
    contacts,
    signers,
    isDapp,
    onApprove,
    onReject,
    onDelete,
    onSelectSigner,
    onSelectSignerPress,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();
  const { copy } = useCopy(localization.copiedSignerAddress[language]);

  const [deleteAlertToggle, setDeleteAlertToggle] = useState(false);

  const origin = parseOrigin(message);
  const isReadyToSend = message.completed && isDapp;
  const isMessageSigned = message.confirmations.length > 0;
  const validSignatures = validateSignatures(
    message.confirmations.map((conf) => conf.signer),
    safeInfo.owners,
  );
  const messageInitialCompletion = useRef(message.completed);
  const hasSelectedSigned = signer && validSignatures.includes(signer.address);
  const canSign = !!signer && !hasSelectedSigned;

  useWithSafeSigner(message, safeInfo, signers, onSelectSigner);

  const onDeleteConfirm = async () => {
    try {
      await onDelete(message);
      setDeleteAlertToggle(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyDeletedMessage[language],
      });
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.failedToDeleteMessage[language],
      });
    }
  };

  const onDeleteCancel = () => {
    setDeleteAlertToggle(false);
  };

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View className='flex h-full flex-col justify-between space-y-3 pt-2'>
            <GeneralInfoCard
              className='mx-4'
              origin={origin}
              wallet={message.wallet}
              type={!messageInitialCompletion.current ? 'proposal' : 'history'}
              startDate={message.createdAt}
            />
            <MessageCard
              className='mx-4'
              message={message.message}
              messageType={message.type}
              type={!messageInitialCompletion.current ? 'proposal' : 'history'}
            />
            {!message.completed ? (
              <SafeInfoCard
                className='mx-4'
                safeInfo={safeInfo}
                signer={signer}
                validSignatures={validSignatures}
                onSignerPress={onSelectSignerPress}
              />
            ) : (
              <Field label={localization.signedBy[language]}>
                <ConfirmedSafeSignersSection
                  wallets={signers}
                  contacts={contacts.data ?? []}
                  confirmations={message.confirmations}
                  onSignerPressed={copy}
                />
              </Field>
            )}
          </View>
        </ScrollView>
        {(!message.completed || isDapp) && (
          <View className='flex flex-row justify-between space-x-4 px-4'>
            <View className='flex-1'>
              <TextButton
                onPress={isDapp ? onReject : () => setDeleteAlertToggle(true)}
                type='tertiary'
                text={
                  isDapp
                    ? localization.reject[language]
                    : isMessageSigned
                    ? localization.dismiss[language]
                    : localization.delete[language]
                }
              />
            </View>
            <View className='flex-1'>
              <TextButton
                onPress={() => onApprove(safeInfo, message)}
                disabled={!isReadyToSend && !canSign}
                text={
                  isReadyToSend
                    ? localization.send[language]
                    : localization.sign[language]
                }
              />
            </View>
          </View>
        )}
      </ViewWithInset>
      <Alert
        title={
          isMessageSigned
            ? localization.dismissMessage[language]
            : localization.deleteMessage[language]
        }
        subtitle={
          isMessageSigned
            ? localization.areYouSureDismissMessage[language]
            : localization.areYouSureDeleteMessage[language]
        }
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        isVisible={deleteAlertToggle}
      />
    </View>
  );
}
