import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function BackupSuccessScreen(props: {
  isRestore: boolean;
  onDone: VoidFunction;
}) {
  const { isRestore, onDone } = props;
  const { language } = useLanguageContext();

  return (
    <ViewWithInset
      className='flex h-full w-full flex-col justify-between px-4'
      hasBottomInset={true}
    >
      <View className='flex flex-1 flex-col items-center justify-center pb-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faCheck} color={colors.success} size={48} />
        </View>
        <Text className='text-text-primary mt-6 text-center text-lg font-medium'>
          {isRestore
            ? localization.restoreSuccess[language]
            : localization.backupSuccess[language]}
        </Text>
        <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.useWallets[language]}
          </Text>
        </View>
      </View>
      <View className='w-full'>
        <TextButton onPress={onDone} text={localization.complete[language]} />
      </View>
    </ViewWithInset>
  );
}
