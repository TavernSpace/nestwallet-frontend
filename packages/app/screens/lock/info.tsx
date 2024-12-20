import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { TextButton } from '../../components/button/text-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

export function LockErrorContent(props: {
  onClose: VoidFunction;
  onReset: VoidFunction;
}) {
  const { onClose, onReset } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex flex-col space-y-2'>
      <ActionSheetHeader
        adornment={
          <View className='bg-primary/10 h-8 w-8 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faCircleInfo}
              color={colors.primary}
              size={20}
            />
          </View>
        }
        title={localization.unableToUnlock[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col space-y-4 px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {localization.unableToUnlockMessage[language]}
        </Text>
        <Text className='text-text-secondary text-sm font-normal'>
          {localization.resetKeychain[language]}
        </Text>
      </View>
      <View className='w-full px-4 pt-4'>
        <TextButton text={localization.reset[language]} onPress={onReset} />
      </View>
    </View>
  );
}
