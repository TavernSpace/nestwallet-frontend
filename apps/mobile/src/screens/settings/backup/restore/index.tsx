import { RestoreBackupScreen } from '@nestwallet/app/screens/backup/restore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { readPasskeyBlob } from '../../../../hooks/passkey';
import { SettingsStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'restoreBackup'
>;

export function RestoreBackupWithData({ route, navigation }: RouteProps) {
  const { encryptionMetadata } = route.params;
  const { walletService } = useAppContext();

  const handleRestoreFromPassword = async (password: string) => {
    await walletService.restoreBackup({
      type: 'password',
      password,
    });
    navigation.navigate('backupSuccess', {
      isRestore: true,
    });
  };

  const handleRestoreFromPasskey = async () => {
    const credentialId = encryptionMetadata.credentialId!;
    const blob = await readPasskeyBlob(credentialId);
    await walletService.restoreBackup({
      type: 'passkey',
      credentialId: credentialId,
      password: blob.backupKek,
    });
    navigation.navigate('backupSuccess', {
      isRestore: true,
    });
  };

  return (
    <RestoreBackupScreen
      encryptionType={encryptionMetadata.type}
      onRestoreFromPassword={handleRestoreFromPassword}
      onRestoreFromPasskey={handleRestoreFromPasskey}
    />
  );
}
