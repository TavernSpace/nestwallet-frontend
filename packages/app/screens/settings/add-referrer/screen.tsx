import { faUser } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { VoidPromiseFunction } from '../../../common/types';
import { WarningBanner } from '../../../components/banner/warning';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export function AddReferrerScreen(props: {
  referralCode: string;
  onConfirm: VoidPromiseFunction;
  onSkip: VoidPromiseFunction;
}) {
  const { referralCode, onConfirm, onSkip } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.referralCodeAdded[language],
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <View className='flex h-full justify-between px-4'>
        <View className='flex flex-col space-y-4'>
          <WarningBanner
            title={localization.actionPermanent[language]}
            subtitle={localization.choosingReferrer[language]}
            body={localization.cannotChangeReferrer[language]}
          />
          <View className='flex flex-row items-center justify-center'>
            <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full'>
              <FontAwesomeIcon icon={faUser} color={colors.primary} size={48} />
            </View>
          </View>
          <View className='bg-card items-center space-y-2 rounded-2xl px-4 py-3'>
            <Text className='text-text-primary text-sm font-medium'>
              {localization.wouldYouLikeToAdd[language]}
            </Text>
            <View className='bg-card-highlight flex flex-row items-center justify-between space-x-1 rounded-xl px-3 py-1.5'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.referrer[language]}
              </Text>
              <Text className='text-text-primary text-sm font-medium'>
                {referralCode}
              </Text>
            </View>
          </View>
        </View>

        <View className='flex flex-col space-y-4'>
          <View className='bg-card rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {localization.acceptingReferral[language]}
            </Text>
          </View>
          <View className='flex w-full flex-row space-x-4'>
            <View className='flex-1'>
              <TextButton
                text={localization.decline[language]}
                type='tertiary'
                onPress={onSkip}
                disabled={loading}
              />
            </View>
            <View className='flex-1'>
              <TextButton
                text={localization.accept[language]}
                onPress={handleConfirm}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}