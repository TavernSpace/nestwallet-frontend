import {
  faLinkSimple,
  faPen,
  faTicket,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import {
  ImageSourcePropType,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { adjust } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { IconButton } from '../../../../components/button/icon-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Image } from '../../../../components/image';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { IUser } from '../../../../graphql/client/generated/graphql';
import { ShareItem, ShareOptions } from './share-item';

export const InviteCard = styled(function (props: {
  user: IUser;
  onCopyCode: () => void;
  onCopyLink: () => void;
  handleRedirect: (option: keyof ShareOptions) => Promise<void>;
  onEditReferralCode?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    user,
    onCopyCode,
    onCopyLink,
    handleRedirect,
    onEditReferralCode,
    style,
  } = props;

  return (
    <View
      className='bg-card flex flex-col space-y-3 rounded-2xl p-4'
      style={style}
    >
      <InviteItem
        title='Invite Friends'
        description='Share a link or referral code with your friends.'
        source={{
          uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/high-five.png',
        }}
        width={adjust(32, 2)}
        height={adjust(40, 2)}
      />

      <View className='bg-card-highlight-secondary h-[1px]' />
      <InviteItem
        title='Claim Rewards'
        description='Collect and claim your rewards earned through referrals at the end of each month'
        source={{
          uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/reward-in-hand.png',
        }}
        width={adjust(32, 2)}
        height={adjust(34, 2)}
      />
      <View className='bg-card-highlight-secondary h-[1px]' />
      <Text className='text-text-primary text-base font-medium'>
        Invite Via Link
      </Text>
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-row items-center'>
          <View className='flex flex-row items-center space-x-1.5'>
            <View style={{ width: adjust(80, 16) }}>
              <Text className='text-text-secondary text-sm font-medium'>
                Your Code:
              </Text>
            </View>
          </View>
          <BaseButton onPress={onCopyCode}>
            <View className='bg-receive/10 flex flex-row items-center space-x-2 rounded-xl px-3 py-1.5'>
              <FontAwesomeIcon
                icon={faTicket}
                size={adjust(14, 2)}
                color={colors.receive}
                transform={{ rotate: 315 }}
              />
              <Text
                className='text-receive truncate text-sm font-medium'
                numberOfLines={1}
              >
                {user.referralCode!}
              </Text>
            </View>
          </BaseButton>
        </View>
        {onEditReferralCode ? (
          <IconButton
            icon={faPen}
            size={adjust(14, 2)}
            color={colors.textSecondary}
            onPress={onEditReferralCode}
          />
        ) : null}
      </View>
      <View className='flex flex-row items-center'>
        <View className='flex flex-row items-center space-x-1.5'>
          <View style={{ width: adjust(80, 16) }}>
            <Text className='text-text-secondary text-sm font-medium'>
              Your Link:
            </Text>
          </View>
        </View>
        <BaseButton className='flex-1' onPress={onCopyLink}>
          <View
            className={cn(
              'bg-link/10 flex flex-row items-center space-x-2 rounded-xl py-1.5',
              { 'px-6': Platform.OS !== 'web', 'px-3': Platform.OS === 'web' },
            )}
          >
            <FontAwesomeIcon
              icon={faLinkSimple}
              size={adjust(14, 2)}
              color={colors.link}
            />
            <Text
              className='text-link truncate text-center text-sm font-medium'
              numberOfLines={1}
            >
              {`nestwallet.xyz/?referral=${user.referralCode}`}
            </Text>
          </View>
        </BaseButton>
      </View>
      <ShareItem handleRedirect={handleRedirect} />
    </View>
  );
});

const InviteItem = styled(function (props: {
  source:
    | ImageSourcePropType
    | React.ComponentType<{ height: number; width: number }>;
  title: string;
  description: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { source, title, description, width, height, style } = props;
  return (
    <View style={style} className='flex flex-col space-y-3'>
      <View className='flex flex-row items-center space-x-3'>
        <Image
          source={source as ImageSourcePropType}
          style={{ width: width, height: height }}
        />
        <View className='flex-1 flex-col space-y-1'>
          <Text className='text-text-primary text-sm font-bold'>{title}</Text>
          <Text className='text-text-secondary text-xs font-normal'>
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
});
