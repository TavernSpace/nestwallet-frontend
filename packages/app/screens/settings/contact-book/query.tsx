import { useQueryRefetcher } from '../../../common/hooks/query';
import { loadDataFromQuery } from '../../../common/utils/query';
import {
  IContact,
  useContactsQuery,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { ContactBookScreen } from './screen';

interface ContactBookQueryProps {
  organizationId: string;
  onContactPress: (contact: IContact) => void;
  onAddContact: VoidFunction;
}

export function ContactBookScreenWithQuery(props: ContactBookQueryProps) {
  const { organizationId, onAddContact, onContactPress } = props;

  const contactsQuery = useQueryRefetcher(
    [graphqlType.Contact],
    useContactsQuery({
      filter: {
        organizationId: {
          eq: organizationId,
        },
      },
    }),
  );

  const contacts = loadDataFromQuery(contactsQuery, (data) => {
    const unsortedContacts = data.contacts as IContact[];
    return unsortedContacts
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <ContactBookScreen
      contacts={contacts}
      onAddContact={onAddContact}
      onContactPress={onContactPress}
    />
  );
}
