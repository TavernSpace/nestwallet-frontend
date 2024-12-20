import { faKey } from '@fortawesome/pro-solid-svg-icons';
import { useEffect, useState } from 'react';
import { VoidPromiseFunction } from '../../../common/types';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export function UploadBackupWithPasskeyForm(props: {
  onSubmit: VoidPromiseFunction;
}) {
  const { onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
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

  useEffect(() => {
    handleSubmit();
  }, []);

  return (
    <View className='flex h-full flex-col justify-center'>
      <View className='bg-card mx-4 -mt-12 flex flex-col items-center space-y-2 rounded-[36px] px-4 py-6'>
        <View className='bg-approve/10 h-16 w-16 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faKey} size={36} color={colors.approve} />
        </View>
        <View className='flex flex-col items-center'>
          <Text className='text-text-primary text-base font-medium'>
            {localization.backupWithPasskey[language]}
          </Text>
          <Text className='text-text-secondary text-center text-sm font-normal'>
            {localization.createOrUnlockPasskey[language]}
          </Text>
        </View>
        <View className='w-full pt-4'>
          <TextButton
            text={localization.backup[language]}
            disabled={loading}
            loading={loading}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </View>
  );
}
