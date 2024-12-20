import { ActionSheet } from '@nestwallet/app/components/sheet';
import { EditThresholdContent } from '@nestwallet/app/screens/add-wallet/create-safe/safe-summary/edit-threshold';

interface EditThresholdSheetProps {
  signerCount: number;
  threshold: number;
  isShowing: boolean;
  onClose: VoidFunction;
  onChangeThreshold: (threshold: number) => void;
}

export function EditThresholdSheet(props: EditThresholdSheetProps) {
  const { signerCount, threshold, isShowing, onClose, onChangeThreshold } =
    props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <EditThresholdContent
        signerCount={signerCount}
        threshold={threshold}
        onClose={onClose}
        onChangeThreshold={onChangeThreshold}
      />
    </ActionSheet>
  );
}
