import { faMemoCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { VoidPromiseFunction } from '../../common/types';
import { empty } from '../../common/utils/functions';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheet } from '../../components/sheet';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { SCREEN_HEIGHT, colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { useAcceptTermsMutation } from '../../graphql/client/generated/graphql';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';

interface ToSSheetProps {
  isShowing: boolean;
  onAccept: VoidPromiseFunction;
}

export function ToSSheet(props: ToSSheetProps) {
  const { isShowing, onAccept } = props;
  const { showSnackbar } = useSnackbar();
  const { top, bottom } = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  const acceptTermsMutation = useAcceptTermsMutation();

  const handleOpenTOS = () => {
    Linking.openURL('https://nestwallet.xyz/legal/terms');
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      await acceptTermsMutation.mutateAsync({});
      await onAccept();
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Something went wrong, please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const paddingAdjust = Platform.OS === 'android' ? 80 : 48;
  const bottomAdjust = Math.max(bottom, 16);

  return (
    <ActionSheet
      gestureEnabled={false}
      isShowing={isShowing}
      isDetached={true}
      blur={8}
      onClose={empty}
    >
      <View
        className='flex flex-col justify-between px-4'
        style={{ height: SCREEN_HEIGHT - top - bottomAdjust - paddingAdjust }}
      >
        <View />
        <View className='flex flex-col'>
          <View className='flex w-full flex-col items-center space-y-4'>
            <View className='bg-primary/10 h-20 w-20 items-center justify-center rounded-full p-4'>
              <FontAwesomeIcon
                icon={faMemoCircleInfo}
                color={colors.primary}
                size={48}
              />
            </View>
            <Text className='text-text-primary text-lg font-medium'>
              Terms and Conditions
            </Text>
          </View>
          <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              Please accept the{' '}
              <Text
                className='text-link text-xs font-medium underline'
                onPress={handleOpenTOS}
              >
                Terms of Service
              </Text>{' '}
              to continue using Nest Wallet.
            </Text>
          </View>
          <View className='bg-card-highlight mt-4 h-[1px] w-full' />
          <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {
                'Nest Wallet is a self custody wallet; only you ever have access to your funds and private keys.'
              }
            </Text>
          </View>
          <View className='bg-card mt-2 rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {
                'Nest Wallet does not charge any fees and takes zero commission from your trades.'
              }
            </Text>
          </View>
        </View>
        <TextButton
          text='Accept'
          onPress={handleAccept}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ActionSheet>
  );
}
