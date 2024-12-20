import {
  IconDefinition,
  faLinkHorizontal,
} from '@fortawesome/pro-solid-svg-icons';
import { adjust, withSize } from '@nestwallet/app/common/utils/style';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import cn from 'classnames';
import { NestLight } from '../../../../components/logo/nest';
import { getOAuthProviderName } from '../../../../features/oauth/utils';
import { useSafeAreaInsets } from '../../../../features/safe-area';
import { IOAuthProvider } from '../../../../graphql/client/generated/graphql';

export interface ConnectOAuthProps {
  hasPageHeader: boolean;
  handleConnectOauth: VoidFunction;
  oAuthProvider: IOAuthProvider;
  oAuthlogo: IconDefinition;
}

export function ConnectOAuth(props: ConnectOAuthProps) {
  const { hasPageHeader, handleConnectOauth, oAuthProvider, oAuthlogo } = props;
  const { bottom } = useSafeAreaInsets();

  const oAuthName = getOAuthProviderName(oAuthProvider);

  return (
    <View className='h-full w-full flex-col justify-between px-4'>
      <View
        className={cn('flex-col space-y-6', {
          'pt-4': !hasPageHeader,
        })}
      >
        <View className='flex flex-col items-center'>
          <Text className='text-text-primary text-center text-base font-medium'>
            Connect Account to {oAuthName}
          </Text>
        </View>
        <View className='flex-row items-center justify-center space-x-4 pt-4'>
          <NestLight size={adjust(72)} rounded={true} />
          <FontAwesomeIcon
            icon={faLinkHorizontal}
            size={adjust(32, 4)}
            color={colors.textPrimary}
          />
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-discord': oAuthProvider === IOAuthProvider.Discord,
              'bg-twitter': oAuthProvider === IOAuthProvider.Twitter,
            })}
            style={withSize(adjust(72))}
          >
            <FontAwesomeIcon
              icon={oAuthlogo}
              size={adjust(44, 4)}
              color={colors.textPrimary}
            />
          </View>
        </View>
        <View className='flex flex-col items-center space-y-3 py-2'>
          <Text className='text-text-primary text-lg font-medium'>
            Link your {oAuthName} to earn XP!
          </Text>
          <Text className='text-text-secondary text-sm font-normal'>
            Earn XP when you:
          </Text>
          <View className='bg-card space-y-1 rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              • Connect your {oAuthName} Account
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              • {oAuthProvider === IOAuthProvider.Twitter ? 'Follow ' : 'Join '}
              Nest Wallet
            </Text>
            {oAuthProvider === IOAuthProvider.Twitter && (
              <Text className='text-text-secondary text-xs font-normal'>
                • Like, retweet or comment on a Nest Wallet post or tag Nest
                Wallet
              </Text>
            )}
          </View>
        </View>
      </View>

      <View
        className='flex flex-col space-y-2'
        style={{ paddingBottom: bottom }}
      >
        <View className='bg-card rounded-xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            Note: We will not reward {oAuthName} bots or spammers
          </Text>
        </View>
        <BaseButton onPress={handleConnectOauth} className='w-full'>
          <View
            className={cn(
              'w-full flex-row items-center justify-center space-x-3 rounded-full py-3',
              {
                'bg-discord/20': oAuthProvider === IOAuthProvider.Discord,
                'bg-twitter/20': oAuthProvider === IOAuthProvider.Twitter,
              },
            )}
          >
            <Text
              className={cn('text-sm font-bold', {
                'text-discord': oAuthProvider === IOAuthProvider.Discord,
                'text-twitter': oAuthProvider === IOAuthProvider.Twitter,
              })}
            >
              Connect {oAuthName}
            </Text>
          </View>
        </BaseButton>
      </View>
    </View>
  );
}
