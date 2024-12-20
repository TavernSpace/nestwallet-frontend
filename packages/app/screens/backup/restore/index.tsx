import { VoidPromiseFunction } from '../../../common/types';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { RestoreBackupWithPasskeyForm } from './passkey';
import { RestoreBackupWithPasswordForm } from './password';

export function RestoreBackupScreen(props: {
  encryptionType: 'passkey' | 'password';
  onRestoreFromPasskey: VoidPromiseFunction;
  onRestoreFromPassword: (password: string) => Promise<void>;
}) {
  const { encryptionType, onRestoreFromPasskey, onRestoreFromPassword } = props;
  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      {encryptionType === 'passkey' ? (
        <RestoreBackupWithPasskeyForm onSubmit={onRestoreFromPasskey} />
      ) : (
        <RestoreBackupWithPasswordForm onSubmit={onRestoreFromPassword} />
      )}
    </ViewWithInset>
  );
}
