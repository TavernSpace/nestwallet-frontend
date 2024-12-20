import {
  IconDefinition,
  faCheck,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import ExecutingLottie from '@nestwallet/app/assets/animations/executing-lottie.json';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import cn from 'classnames';
import { adjust } from '../../../../common/utils/style';
import { TextButton } from '../../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import LottieView from '../../../../components/lottie-view';
import { colors } from '../../../../design/constants';
import { getOAuthProviderName } from '../../../../features/oauth/utils';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import { IOAuthProvider } from '../../../../graphql/client/generated/graphql';

export interface OAuthResultProps {
  status: 'success' | 'loading' | 'failure';
  oAuthProvider: IOAuthProvider;
  oAuthlogo: IconDefinition;
}

export function OAuthResult(props: OAuthResultProps) {
  const { status, oAuthProvider, oAuthlogo } = props;
  const { bottom } = useSafeAreaInsets();
  const oAuthName = getOAuthProviderName(oAuthProvider);

  function handleClose() {
    window.close();
  }

  return status === 'loading' ? (
    <View className='h-full w-full flex-col items-center justify-center'>
      <LottieView
        animatedData={ExecutingLottie}
        autoplay
        loop={true}
        height={100}
      />
    </View>
  ) : (
    <View className='flex h-full w-full flex-col justify-between px-7 py-4'>
      <View className='flex flex-col items-center justify-center space-y-4 pt-10'>
        <View>
          <View
            className={cn('rounded-full p-4', {
              'bg-discord': oAuthProvider === IOAuthProvider.Discord,
              'bg-twitter': oAuthProvider === IOAuthProvider.Twitter,
            })}
          >
            <FontAwesomeIcon
              icon={oAuthlogo}
              size={adjust(44, 4)}
              color={colors.textPrimary}
            />
          </View>
          <View className='absolute -right-0.5 bottom-0'>
            <View
              className={cn('rounded-full p-1', {
                'bg-success': status === 'success',
                'bg-failure': status !== 'success',
              })}
            >
              <FontAwesomeIcon
                icon={status === 'success' ? faCheck : faTimes}
                color={colors.textPrimary}
                size={14}
              />
            </View>
          </View>
        </View>

        {status === 'success' ? (
          <View>
            <Text className='text-text-primary text-center text-xl font-bold'>
              Success!
            </Text>
            <View className='items-center px-8 py-2'>
              <Text className='text-text-secondary text-center text-sm font-normal'>
                You have successfuly linked your {oAuthName} account to Nest
                Wallet.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Text className='text-text-primary text-center text-xl font-bold'>
              Error
            </Text>
            <View className='items-center px-8 py-2'>
              <Text className='text-text-secondary text-center text-sm font-normal'>
                There was an issue linking your {oAuthName} account to Nest
                Wallet.
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ paddingBottom: bottom }}>
        <TextButton text='Close' onPress={handleClose} />
      </View>
    </View>
  );
}
