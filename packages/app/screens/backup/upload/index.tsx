import { VoidPromiseFunction } from '../../../common/types';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { UploadBackupWithPasskeyForm } from './passkey';
import { UploadBackupWithPasswordForm } from './password';

export function UploadBackupScreen(props: {
  isPasskeySupported: boolean;
  onBackupWithPasskey: VoidPromiseFunction;
  onBackupWithPassword: (password: string) => Promise<void>;
}) {
  const { isPasskeySupported, onBackupWithPasskey, onBackupWithPassword } =
    props;

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      {isPasskeySupported ? (
        <UploadBackupWithPasskeyForm onSubmit={onBackupWithPasskey} />
      ) : (
        <UploadBackupWithPasswordForm onSubmit={onBackupWithPassword} />
      )}
    </ViewWithInset>
  );
}
