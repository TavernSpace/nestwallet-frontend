/* eslint-disable react/jsx-no-undef */
import { Avatar } from 'react-native-paper';
import { NestWalletClient } from '../../../common/api/nestwallet/client';
import { opacity } from '../../../common/utils/functions';
import { colors } from '../../../design/constants';
import { IContact } from '../../../graphql/client/generated/graphql';
import { Image } from '../../image';

interface IContactAvatarProps {
  contact: IContact;
  size: number;
}

export function ContactAvatar(props: IContactAvatarProps) {
  const { contact, size } = props;

  if (contact.profilePicture) {
    return (
      <Image
        className='rounded-full'
        style={{ width: size, height: size }}
        source={{
          uri: NestWalletClient.getFileURL(contact.profilePicture.id),
        }}
      />
    );
  }
  return (
    <Avatar.Text
      color={colors.primary}
      label={contact.name.substring(0, 1).toLocaleUpperCase()}
      size={size}
      style={{ backgroundColor: opacity(colors.primary, 10) }}
    />
  );
}
