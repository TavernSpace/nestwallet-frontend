import { faUserCircle } from '@fortawesome/pro-light-svg-icons';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { NestWalletClient } from '../../../common/api/nestwallet/client';
import { IFile, Maybe } from '../../../graphql/client/generated/graphql';
import { FilledIconButton } from '../../button/icon-button';
import { Image } from '../../image';
import { View } from '../../view';

export interface IUserLike {
  profilePicture?: Maybe<IFile>;
}

interface IUserAvatarProps {
  user?: IUserLike;
  imageUrl?: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}

export const UserAvatar = styled(function (props: IUserAvatarProps) {
  const { user, imageUrl, size, style } = props;

  if (imageUrl) {
    return (
      <View
        className='overflow-hidden rounded-full bg-transparent'
        style={style}
      >
        <Image
          source={{
            uri: imageUrl,
          }}
          className='rounded-full'
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  if (user?.profilePicture) {
    return (
      <View
        className='text-text-primary overflow-hidden rounded-full bg-white'
        style={style}
      >
        <Image
          source={{
            uri: NestWalletClient.getFileURL(user!.profilePicture!.id),
          }}
          className='rounded-full'
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  return <FilledIconButton icon={faUserCircle} size={size} rounded={true} />;
});
