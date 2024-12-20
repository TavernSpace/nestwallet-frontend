import { ActionSheet } from '@nestwallet/app/components/sheet';
import { EditNameContent } from '@nestwallet/app/screens/add-wallet/create-safe/safe-summary/edit-name';

interface EditNameSheetProps {
  name: string;
  isShowing: boolean;
  onClose: VoidFunction;
  onChangeName: (name: string) => void;
}

export function EditNameSheet(props: EditNameSheetProps) {
  const { name, isShowing, onClose, onChangeName } = props;

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <EditNameContent
        name={name}
        onClose={onClose}
        onChangeName={onChangeName}
      />
    </ActionSheet>
  );
}
