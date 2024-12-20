import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { useCreatePasskeyIdentityMutation } from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { UploadBackupScreen } from '@nestwallet/app/screens/backup/upload';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { createPasskey, writePasskeyBlob } from '../../../../hooks/passkey';
import { SettingsStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';
import { ensureCloudStorage } from './utils';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'uploadBackup'
>;

export const UploadBackupWithData = withUserContext(_UploadBackupWithData);

function _UploadBackupWithData({ route, navigation }: RouteProps) {
  const { passkey } = route.params;
  const { walletService } = useAppContext();
  const { user } = useUserContext();
  const { toggleAutoLock } = useLockContext();

  const createPasskeyIdentityMutation = useMutationEmitter(
    graphqlType.UserIdentity,
    useCreatePasskeyIdentityMutation(),
  );

  const handleBackupWithPassword = async (password: string) => {
    await ensureCloudStorage(toggleAutoLock).catch((err) => {
      toggleAutoLock(true);
      throw err;
    });
    await walletService.enableBackup({
      type: 'password',
      password,
    });
    navigation.navigate('backupSuccess', {
      isRestore: false,
    });
  };

  const handleBackupWithPasskey = async () => {
    await ensureCloudStorage(toggleAutoLock).catch((err) => {
      toggleAutoLock(true);
      throw err;
    });
    // if a keyring already exists, prompt user to see if they want to override
    const backupPassword = {
      backupKek: walletService.generateSalt(64),
    };
    const passkeyInfo = await createPasskey(user);
    await createPasskeyIdentityMutation.mutateAsync({
      input: {
        credentialID: passkeyInfo.rawId,
        platform: Platform.OS.toLowerCase(),
      },
    });
    await writePasskeyBlob(passkeyInfo.rawId, backupPassword);
    await walletService.enableBackup({
      type: 'passkey',
      credentialId: passkeyInfo.rawId,
      password: backupPassword.backupKek,
    });
    navigation.navigate('backupSuccess', {
      isRestore: false,
    });
  };

  useEffect(() => {
    return () => toggleAutoLock(true);
  }, []);

  return (
    <UploadBackupScreen
      isPasskeySupported={passkey}
      onBackupWithPasskey={handleBackupWithPasskey}
      onBackupWithPassword={handleBackupWithPassword}
    />
  );
}
