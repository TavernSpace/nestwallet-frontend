import { IContact } from '@nestwallet/app/graphql/client/generated/graphql';
import { ContactBookScreenWithQuery } from '@nestwallet/app/screens/settings/contact-book/query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<SettingsStackParamList, 'contacts'>;

export const ContactsWithData = withUserContext(_ContactsWithData);

function _ContactsWithData({ navigation, route }: RouteProps) {
  const { accounts } = useUserContext();

  const organization = accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const handleContactPress = (contact: IContact) => {
    navigation.navigate('upsertContact', {
      contact,
    });
  };

  const handleAddContact = () => {
    navigation.navigate('upsertContact', {});
  };

  return (
    <ContactBookScreenWithQuery
      organizationId={organization.id}
      onContactPress={handleContactPress}
      onAddContact={handleAddContact}
    />
  );
}
