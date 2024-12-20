import {
  faCloudArrowDown,
  faCloudArrowUp,
} from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Platform } from 'react-native';
import { VoidPromiseFunction } from '../../../common/types';
import { withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export function BackupWalletScreen(props: {
  onBackup: VoidPromiseFunction;
  onRestore: VoidPromiseFunction;
}) {
  const { onRestore, onBackup } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);
      await onBackup();
    } catch (err) {
      const error = parseError(err, localization.backupError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      await onRestore();
    } catch (err) {
      const error = parseError(err, localization.restoreError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between'>
        <View className='flex flex-1 flex-col space-y-2 px-4'>
          <ButtonListItem
            onPress={handleBackup}
            title={localization.backupWallets[language]}
            subtitle={
              localization.backupWalletsDescription(
                Platform.OS === 'ios'
                  ? localization.iCloud[language]
                  : localization.googleDrive[language],
              )[language]
            }
            disabled={loading}
          >
            <View
              className='bg-success/10 mt-1 flex flex-row items-center justify-center rounded-full'
              style={withSize(40)}
            >
              <FontAwesomeIcon
                icon={faCloudArrowUp}
                size={20}
                color={colors.success}
              />
            </View>
          </ButtonListItem>

          <ButtonListItem
            onPress={handleRestore}
            title={localization.restoreWallets[language]}
            subtitle={
              localization.restoreWalletsDescription(
                Platform.OS === 'ios'
                  ? localization.iCloud[language]
                  : localization.googleDrive[language],
              )[language]
            }
            disabled={loading}
          >
            <View
              className='bg-approve/10 mt-1 flex flex-row items-center justify-center rounded-full'
              style={withSize(40)}
            >
              <FontAwesomeIcon
                icon={faCloudArrowDown}
                size={20}
                color={colors.approve}
              />
            </View>
          </ButtonListItem>
        </View>
        <View className='bg-card mx-4 rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.encryptionText[language]}
          </Text>
        </View>
      </View>
    </ViewWithInset>
  );
}
