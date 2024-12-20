import { formatAddress } from '../../../common/format/address';
import { Loadable } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { ContactAvatar } from '../../../components/avatar/contact-avatar';
import { TextButton } from '../../../components/button/text-button';
import { BlockchainChip } from '../../../components/chip';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { IContact } from '../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../molecules/error/screen';
import { useLanguageContext } from '../../../provider/language';
import { ContactsEmptyState } from './empty-state';
import { localization } from './localization';

interface ContactBookScreenProps {
  contacts: Loadable<IContact[]>;
  onContactPress: (contact: IContact) => void;
  onAddContact: VoidFunction;
}

export const ContactBookScreen = (props: ContactBookScreenProps) => {
  const { contacts, onContactPress, onAddContact } = props;
  const { language } = useLanguageContext();

  const renderItem = ({ item }: RenderItemProps<IContact>) => (
    <ContactBookItem
      key={item.id}
      contact={item}
      onPress={() => onContactPress(item)}
    />
  );

  return onLoadable(contacts)(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetContacts[language]}
        description={localization.somethingWentWrong[language]}
      />
    ),
    (contacts) =>
      contacts.length === 0 ? (
        <ViewWithInset className='h-full w-full' hasBottomInset={true}>
          <ContactsEmptyState onAddContact={onAddContact} />
        </ViewWithInset>
      ) : (
        <View className='absolute h-full w-full'>
          <ViewWithInset className='h-full w-full' hasBottomInset={true}>
            <View className='flex-1'>
              <FlatList
                data={contacts}
                estimatedItemSize={adjust(64)}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
              />
            </View>
            <View className='flex w-full flex-col space-y-2 px-4 pt-4'>
              <TextButton
                onPress={onAddContact}
                text={localization.addContact[language]}
              />
            </View>
          </ViewWithInset>
        </View>
      ),
  );
};

function ContactBookItem(props: { contact: IContact; onPress: VoidFunction }) {
  const { contact, onPress } = props;

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center justify-between px-4 py-4'>
        <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
          <View className='flex flex-row items-center justify-center overflow-hidden'>
            <ContactAvatar contact={contact} size={adjust(36)} />
          </View>
          <View className='flex flex-1 flex-col'>
            <Text
              className='text-text-primary overflow-hidden truncate text-sm font-medium'
              numberOfLines={1}
            >
              {contact.name}
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatAddress(contact.address)}
            </Text>
          </View>
        </View>
        <BlockchainChip blockchain={contact.blockchain} />
      </View>
    </ListItem>
  );
}
