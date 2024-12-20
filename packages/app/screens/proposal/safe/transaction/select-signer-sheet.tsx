import { ISignerWallet } from '@nestwallet/app/common/types';
import { ActionSheet } from '@nestwallet/app/components/sheet';
import { useSafeTransactionProposalContext } from '@nestwallet/app/provider/safe-transaction-proposal';
import { SafeSelectSignerContent } from '@nestwallet/app/screens/proposal/safe/select-signer-sheet';

interface SafeTransactionProposalSelectSignerProps {
  signer?: ISignerWallet;
  signers: ISignerWallet[];
  isShowing: boolean;
  onClose: VoidFunction;
  onSelectSigner: (signer: ISignerWallet) => void;
}

export function SafeTransactionProposalSelectSignerSheet(
  props: SafeTransactionProposalSelectSignerProps,
) {
  const { signer, signers, isShowing, onClose, onSelectSigner } = props;
  const { proposal, safeInfo, contacts } = useSafeTransactionProposalContext();

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
        proposal={{ type: 'transaction', proposal }}
        contacts={contacts}
        onSelectSigner={onSelectSigner}
        onClose={onClose}
      />
    </ActionSheet>
  );
}
