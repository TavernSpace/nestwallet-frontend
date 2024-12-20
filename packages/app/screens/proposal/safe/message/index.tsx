import { SafeInfoResponse } from '@safe-global/api-kit';
import { useState } from 'react';
import { useMutationEmitter } from '../../../../common/hooks/query';
import {
  IDappData,
  ISignerWallet,
  VoidPromiseFunction,
} from '../../../../common/types';
import { empty } from '../../../../common/utils/functions';
import { onLoadable } from '../../../../common/utils/query';
import { TrezorAction } from '../../../../features/keyring/trezor/types';
import {
  getTrezorRequestPayload,
  shouldOpenTab,
} from '../../../../features/keyring/trezor/utils';
import { useConfirmSafeMessageProposal } from '../../../../features/safe/sign';
import { isSafeMessageProposalReady } from '../../../../features/safe/utils';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { getValidSigners } from '../../../../features/wallet/utils';
import {
  IBlockchainType,
  IMessageProposalType,
  ISafeMessageProposal,
  useDeleteMessageProposalMutation,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { ErrorScreen } from '../../../../molecules/error/screen';
import { useLanguageContext } from '../../../../provider/language';
import { WindowType } from '../../../../provider/nestwallet';
import { useSafeMessageProposalContext } from '../../../../provider/safe-message-proposal';
import { SigningSheet } from '../../signing-sheet';
import { localization } from './localization';
import { SafeMessageProposalSelectSignerSheet } from './select-signer-sheet';
import { SafeMessageProposalView } from './view';

interface SafeMessageProposalProps {
  dappData?: IDappData;
  signers: ISignerWallet[];
  windowType?: WindowType;
  walletService: IProtectedWalletClient;
  onApprove: (message: ISafeMessageProposal) => Promise<void>;
  onReject: VoidPromiseFunction;
  onClose: VoidFunction;
  onDeleted: VoidFunction;
  onTrezorRequest?: (payload: object) => void;
}

export function SafeMessageProposal(props: SafeMessageProposalProps) {
  const { message, isDapp, contacts, safeInfo } =
    useSafeMessageProposalContext();
  const {
    dappData,
    signers,
    windowType = WindowType.none,
    walletService,
    onApprove,
    onReject,
    onClose,
    onDeleted,
    onTrezorRequest = empty,
  } = props;
  const { language } = useLanguageContext();

  const [selectedSigner, setSelectedSigner] = useState<ISignerWallet>();
  const [showSelectSignerSheet, setShowSelectSignerSheet] = useState(false);
  const [showSigningSheet, setShowSigningSheet] = useState(false);

  const deleteMessageProposalMutation = useMutationEmitter(
    [graphqlType.Message, graphqlType.Notification],
    useDeleteMessageProposalMutation(),
  );
  const confirmMessageProposalMutation = useConfirmSafeMessageProposal();

  const handleDelete = async (message: ISafeMessageProposal) => {
    await deleteMessageProposalMutation.mutateAsync({
      input: {
        id: message.id,
        type: IMessageProposalType.Safe,
      },
    });
    onDeleted();
  };

  const handleApprove = async (
    safeInfo: SafeInfoResponse,
    message: ISafeMessageProposal,
  ) => {
    const isMessageReady = isSafeMessageProposalReady(safeInfo, message);
    const requiresNewTab = shouldOpenTab(windowType, selectedSigner);
    if (isMessageReady && dappData) {
      await onApprove(message);
      onClose();
    } else if (!isMessageReady) {
      if (!requiresNewTab) {
        setShowSigningSheet(true);
      } else if (selectedSigner) {
        onTrezorRequest(
          getTrezorRequestPayload(selectedSigner, {
            type: TrezorAction.SafeMessageSign,
            proposal: message,
          }),
        );
      }
    }
  };

  const handleSign = async (wallet: ISignerWallet) => {
    const signer = await walletService.getEvmSigner(
      message.wallet.chainId,
      wallet,
    );
    await confirmMessageProposalMutation.mutateAsync(signer, message);
  };

  const handleSelectSigner = (signer: ISignerWallet | undefined) => {
    setSelectedSigner(signer);
    setShowSelectSignerSheet(false);
  };

  const handleSelectSignerPress = () => {
    setShowSelectSignerSheet(true);
  };

  const handleSelectSignerClose = () => {
    setShowSelectSignerSheet(false);
  };

  const validSigners = getValidSigners(signers, IBlockchainType.Evm);

  return onLoadable(safeInfo)(
    () => null,
    () => (
      <ErrorScreen
        title={localization.unableToGetSafeInfo[language]}
        description={localization.somethingWentWrong[language]}
      />
    ),
    (safeInfo) => (
      <>
        <SafeMessageProposalView
          message={message}
          safeInfo={safeInfo}
          contacts={contacts}
          signer={selectedSigner}
          signers={validSigners}
          isDapp={isDapp}
          onApprove={handleApprove}
          onDelete={handleDelete}
          onReject={onReject}
          onSelectSigner={handleSelectSigner}
          onSelectSignerPress={handleSelectSignerPress}
        />
        <SafeMessageProposalSelectSignerSheet
          signer={selectedSigner}
          signers={signers}
          isShowing={showSelectSignerSheet}
          onSelectSigner={handleSelectSigner}
          onClose={handleSelectSignerClose}
        />
        {selectedSigner && (
          <SigningSheet
            wallet={selectedSigner}
            type='message'
            isShowing={showSigningSheet}
            onClose={() => setShowSigningSheet(false)}
            onCompleted={() => setShowSigningSheet(false)}
            onSign={() => handleSign(selectedSigner)}
          />
        )}
      </>
    ),
  );
}
