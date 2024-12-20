import { ISignerWallet } from '../../../../common/types';
import { ActionSheet } from '../../../../components/sheet';
import { useSafeMessageProposalContext } from '../../../../provider/safe-message-proposal';
import { SafeSelectSignerContent } from '../select-signer-sheet';

interface SafeMessageProposalSelectSignerProps {
  signer?: ISignerWallet;
  signers: ISignerWallet[];
  isShowing: boolean;
  onClose: VoidFunction;
  onSelectSigner: (signer: ISignerWallet) => void;
}

export function SafeMessageProposalSelectSignerSheet(
  props: SafeMessageProposalSelectSignerProps,
) {
  const { signer, signers, isShowing, onClose, onSelectSigner } = props;
  const { message, safeInfo, contacts } = useSafeMessageProposalContext();

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasTopInset={true}
    >
      <SafeSelectSignerContent
        signer={signer}
        signers={signers}
        safeInfo={safeInfo}
        proposal={{ type: 'message', proposal: message }}
        contacts={contacts}
        onSelectSigner={onSelectSigner}
        onClose={onClose}
      />
    </ActionSheet>
  );
}
