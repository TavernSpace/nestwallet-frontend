import { IContact } from '@nestwallet/app/graphql/client/generated/graphql';
import { ContactBookScreenWithQuery } from '@nestwallet/app/screens/settings/contact-book/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'contacts'>;

export const ContactsWithData = withUserContext(_ContactsWithData);

function _ContactsWithData({ route }: RouteProps) {
  const { accounts } = useUserContext();
  const navigation = useNavigation();

  const organization = accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const handleContactPress = (contact: IContact) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'upsertContact',
        params: {
          contact,
        },
      },
    });
  };

  const handleAddContact = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'upsertContact',
        params: {},
      },
    });
  };

  return (
    <ContactBookScreenWithQuery
      organizationId={organization.id}
      onContactPress={handleContactPress}
      onAddContact={handleAddContact}
    />
  );
}
