import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Platform } from 'react-native';
import { adjust, withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface AutoLockTimerProps {
  onSetAutoLockTimer: (timer: number) => Promise<void>;
  currentAutoLockTime: number;
}

export function SetAutoLockTimerScreen(props: AutoLockTimerProps) {
  const { onSetAutoLockTimer, currentAutoLockTime } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);

  const handleSelectTime = async (time: number) => {
    try {
      setLoading(true);
      await onSetAutoLockTimer(time);
    } catch (err) {
      const error = parseError(
        err,
        'Something went wrong trying to update you lock timer',
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const autoLockTimes = [
    { label: localization.immediately[language], value: 0 },
    { label: localization.oneMinute[language], value: 1, mobileOnly: true },
    { label: localization.fiveMinutes[language], value: 5 },
    { label: localization.fifteenMinutes[language], value: 15 },
    { label: localization.thirtyMinutes[language], value: 30 },
    { label: localization.oneHour[language], value: 60 },
    { label: localization.twoHours[language], value: 120 },
    { label: localization.fourHours[language], value: 240 },
    { label: localization.eightHours[language], value: 480 },
    { label: localization.twelveHours[language], value: 720 },
  ];

  const validTimes = autoLockTimes.filter((time) =>
    Platform.OS === 'web' ? !time.mobileOnly : true,
  );

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='mt-4 flex w-full flex-col space-y-4'>
          <View className='bg-card overflow-hidden rounded-2xl'>
            <View className='flex flex-col'>
              {validTimes.map((time, index) => (
                <View key={time.value}>
                  <ListItem
                    onPress={() => handleSelectTime(time.value)}
                    disabled={loading || time.value === currentAutoLockTime}
                  >
                    <View className='flex flex-row items-center justify-between px-4 py-3'>
                      <Text className='text-text-primary text-sm font-medium'>
                        {time.label}
                      </Text>
                      {currentAutoLockTime === time.value && (
                        <View
                          className='bg-primary/10 items-center justify-center rounded-full'
                          style={withSize(adjust(20))}
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            color={colors.primary}
                            size={adjust(14, 2)}
                          />
                        </View>
                      )}
                    </View>
                  </ListItem>
                  {index < validTimes.length - 1 && (
                    <View className='w-full px-4'>
                      <View className='bg-card-highlight h-[1px] w-full' />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {`${localization.reauthenticationRequiredText[language]} ${
              Platform.OS === 'web'
                ? localization.timerBeginsOnUnlock[language]
                : localization.timerBeginsOnClose[language]
            }`}
          </Text>
        </View>
      </View>
    </ViewWithInset>
  );
}
