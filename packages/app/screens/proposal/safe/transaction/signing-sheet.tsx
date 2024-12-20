import {
  ISignerWallet,
  SafeTransactionProposalWithNonce,
} from '@nestwallet/app/common/types';
import {
  composeLoadables,
  makeLoadable,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { sanitizeTypedData } from '@nestwallet/app/features/keyring/utils';
import { safeTransactionProposalHasNonce } from '@nestwallet/app/features/proposal/utils';
import { getSafeTxTypedData } from '@nestwallet/app/features/safe/utils';
import { useSafeTransactionProposalContext } from '@nestwallet/app/provider/safe-transaction-proposal';
import { SigningSheet } from '../../signing-sheet';

interface SafeTransactionProposalSigningSheetProps {
  signer: ISignerWallet;
  isShowing: boolean;
  onClose: VoidFunction;
  onSign: (transaction: SafeTransactionProposalWithNonce) => Promise<void>;
}

export function SafeTransactionProposalSigningSheet(
  props: SafeTransactionProposalSigningSheetProps,
) {
  const { signer, isShowing, onClose, onSign } = props;
  const { proposal, safeInfo, nonceData } = useSafeTransactionProposalContext();

  const proposalWithNonce = safeTransactionProposalHasNonce(proposal)
    ? makeLoadable(proposal)
    : composeLoadables(
        safeInfo,
        nonceData,
      )((safeInfo, nonceData) => ({
        ...proposal,
        safeNonce: Math.max(safeInfo.nonce, nonceData.latestNonce + 1),
      }));

  const handleSign = async () => {
    if (proposalWithNonce.success) {
      await onSign(proposalWithNonce.data);
    }
  };

  return onLoadable(proposalWithNonce)(
    () => null,
    () => null,
    (proposal) => (
      <SigningSheet
        wallet={signer}
        type='transaction'
        isShowing={isShowing}
        typedData={sanitizeTypedData(getSafeTxTypedData(proposal))}
        onClose={onClose}
        onCompleted={onClose}
        onSign={handleSign}
      />
    ),
  );
}
