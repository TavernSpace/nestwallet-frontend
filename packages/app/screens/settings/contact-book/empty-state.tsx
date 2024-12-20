import EmptyContacts from '../../../assets/images/empty-contacts.svg';
import { TextButton } from '../../../components/button/text-button';
import { Svg } from '../../../components/svg';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function ContactsEmptyState(props: { onAddContact: VoidFunction }) {
  const { onAddContact } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl px-4'>
      <View />
      <View className='flex w-full flex-col items-center'>
        <View className='py-2'>
          <Svg source={EmptyContacts} width={88} height={72} />
        </View>
        <Text className='text-text-primary mt-4 text-center text-base font-medium'>
          {localization.noContactsAdded[language]}
        </Text>
        <Text className='text-text-secondary mt-2 px-4 pb-2 text-center text-xs font-normal'>
          {localization.addCommonlyUsedAddresses[language]}
        </Text>
      </View>
      <View className='flex w-full flex-row space-x-2 pt-4'>
        <TextButton
          className='flex-1'
          onPress={onAddContact}
          text={localization.createContact[language]}
        />
      </View>
    </View>
  );
}
