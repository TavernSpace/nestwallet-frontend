import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IContact,
  IUpsertContactInput,
  useDeleteContactMutation,
  useUpsertContactMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { sanitizeUpsertContactMutation } from '@nestwallet/app/graphql/utils';
import { UpsertContactScreen } from '@nestwallet/app/screens/settings/upsert-contact/screen';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'upsertContact'>;

export const UpsertContactWithData = withUserContext(_UpsertContactWithData);

function _UpsertContactWithData({ route }: RouteProps) {
  const { contact } = route.params;
  const { accounts } = useUserContext();
  const navigation = useNavigation();

  const upsertContactMutation = useMutationEmitter(
    graphqlType.Contact,
    useUpsertContactMutation(),
  );
  const deleteContactMutation = useMutationEmitter(
    graphqlType.Contact,
    useDeleteContactMutation(),
  );

  const organization = accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const handleSubmitContact = async (value: IUpsertContactInput) => {
    const input = sanitizeUpsertContactMutation(value);
    await upsertContactMutation.mutateAsync({
      input: input,
    });
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'contacts',
      },
    });
  };

  const handleRemovePress = async (contact: IContact) => {
    await deleteContactMutation.mutateAsync({
      id: contact.id,
    });
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'contacts',
      },
    });
  };

  return (
    <UpsertContactScreen
      contact={contact}
      organizationId={organization.id}
      onSubmitContact={handleSubmitContact}
      onRemoveContact={handleRemovePress}
    />
  );
}
