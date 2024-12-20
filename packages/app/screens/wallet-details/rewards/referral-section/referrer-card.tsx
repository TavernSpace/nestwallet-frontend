import { isNil } from 'lodash';
import { StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../../../common/format/address';
import { adjust, withSize } from '../../../../common/utils/style';
import { UserAvatar } from '../../../../components/avatar/user-avatar';
import { TextButton } from '../../../../components/button/text-button';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { nullAddress } from '../../../../features/evm/constants';
import {
  IReferral,
  IUser,
  Maybe,
} from '../../../../graphql/client/generated/graphql';

interface ReferrerCardProps {
  user: IUser;
  onAddReferrerPressed: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ReferrerCard(props: ReferrerCardProps) {
  const { user, onAddReferrerPressed, style } = props;

  return (
    <View className='bg-card space-y-2 rounded-2xl p-4' style={style}>
      <Text className='text-text-primary text-base font-medium'>
        {!user.referrer ? 'No Referrer' : 'Referred By'}
      </Text>
      <View className='flex w-full flex-col'>
        {!user.referrer ? (
          <View className='flex flex-col space-y-4'>
            <Text className='text-text-secondary text-sm font-medium'>
              Add a referrer to earn 20% bonus $NEST XP.
            </Text>
            <TextButton text='Add Referrer' onPress={onAddReferrerPressed} />
          </View>
        ) : (
          <View className='flex items-start justify-center space-y-2'>
            <ReferralUserItem
              user={user.referrer}
              userName={user.referrer.name}
              address={user.referrer.address}
            />
            <Text className='text-text-secondary text-sm font-medium'>
              Currently receiving 20% bonus $NEST XP.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface IUserItemProps {
  user?: IReferral;
  userName?: Maybe<string | undefined>;
  address?: Maybe<string | undefined>;
  data?: string;
  size?: 'large' | 'small';
}

export const ReferralUserItem = (props: IUserItemProps) => {
  const { user, userName, address, data, size = 'small' } = props;

  const itemSize = adjust(size === 'large' ? 52 : 36);

  return (
    <View className='flex flex-row items-center justify-between space-x-2'>
      <View className='flex flex-1 flex-row space-x-3'>
        <View
          className='flex flex-none flex-row items-center justify-center rounded-full'
          style={withSize(itemSize)}
        >
          <View
            className='relative flex flex-row justify-around overflow-hidden'
            style={withSize(itemSize)}
          >
            <UserAvatar user={user} size={itemSize} />
          </View>
        </View>

        <View className='flex flex-col justify-center'>
          <Text
            className='text-text-primary truncate text-sm font-medium'
            numberOfLines={1}
          >
            {userName ? userName : 'User'}
          </Text>
          {!!address && address !== nullAddress ? (
            <Text
              className='text-text-secondary truncate text-xs font-normal'
              numberOfLines={1}
            >
              {formatAddress(address)}
            </Text>
          ) : null}
        </View>
      </View>
      {!isNil(data) ? (
        <Text className='text-text-primary text-sm font-medium'>{data}</Text>
      ) : null}
    </View>
  );
};
