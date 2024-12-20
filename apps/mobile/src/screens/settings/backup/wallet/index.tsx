import {
  loadDataFromQuery,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { ErrorScreen } from '@nestwallet/app/molecules/error/screen';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { BackupWalletScreen } from '@nestwallet/app/screens/backup/wallet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsPasskeySupportedQuery } from '../../../../hooks/passkey';
import { SettingsStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'backupWallet'
>;

export const BackupWalletWithData = withUserContext(_BackupWalletWithData);

function _BackupWalletWithData({ navigation }: RouteProps) {
  const { walletService } = useAppContext();
  const { showSnackbar } = useSnackbar();

  const isPasskeySupportedQuery = useIsPasskeySupportedQuery();
  const isPasskeySupported = loadDataFromQuery(isPasskeySupportedQuery);

  const handleBackup = async (hasPasskey: boolean) => {
    navigation.navigate('uploadBackup', {
      passkey: hasPasskey,
    });
  };

  const handleRestore = async (hasPasskey: boolean) => {
    const encryptedMetadata = await walletService.getBackupEncryptionMetadata();
    if (!encryptedMetadata) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'You do not have a backup to restore',
      });
    } else {
      navigation.navigate('restoreBackup', {
        encryptionMetadata: encryptedMetadata,
        passkey: hasPasskey,
      });
    }
  };

  return onLoadable(isPasskeySupported)(
    () => null,
    () => (
      <ErrorScreen
        title='Unable to get Status'
        description={`Something went wrong trying to get your device status, please try again`}
      />
    ),
    (isPasskeySupported) => (
      <BackupWalletScreen
        onBackup={() => handleBackup(isPasskeySupported)}
        onRestore={() => handleRestore(isPasskeySupported)}
      />
    ),
  );
}
