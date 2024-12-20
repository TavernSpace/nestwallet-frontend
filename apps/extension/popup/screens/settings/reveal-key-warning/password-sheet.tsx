import { ActionSheet } from '@nestwallet/app/components/sheet';
import { ConfirmPasswordSheetContent } from '@nestwallet/app/molecules/confirm-password-sheet';
import { SecretType } from '@nestwallet/app/screens/signer/reveal-key/types';

interface PasswordSheetProps {
  secretType: SecretType;
  isShowing: boolean;
  onClose: VoidFunction;
  handleUnlock: (password: string, savePassword?: boolean) => Promise<void>;
}

export function PasswordSheet(props: PasswordSheetProps) {
  const { secretType, isShowing, onClose, handleUnlock } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ConfirmPasswordSheetContent
        type={secretType}
        onClose={onClose}
        onSubmit={handleUnlock}
      />
    </ActionSheet>
  );
}
