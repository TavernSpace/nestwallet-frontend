import {
  faPlus,
  faRotateRight,
  faVault,
} from '@fortawesome/pro-solid-svg-icons';
import { adjust, withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function AddSafeScreen(props: {
  onAddExistingWallet: VoidFunction;
  onCreateNew: VoidFunction;
}) {
  const { onAddExistingWallet, onCreateNew } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);
  const iconSize = adjust(18, 2);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faVault} color={colors.success} size={48} />
        </View>
        <View className='mt-4 flex w-full flex-col justify-center'>
          <Text className='text-text-primary mt-4 text-lg font-medium'>
            {localization.addSafe[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-normal'>
            {localization.addSafeDescription[language]}
          </Text>
          <View className='mt-4 space-y-2'>
            <ButtonListItem
              onPress={onAddExistingWallet}
              title={localization.importExisting[language]}
              subtitle={localization.importExistingSubtitle[language]}
            >
              <View
                className='bg-success/10 flex flex-row items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faRotateRight}
                  size={iconSize}
                  color={colors.success}
                />
              </View>
            </ButtonListItem>
            <ButtonListItem
              onPress={onCreateNew}
              title={localization.createNew[language]}
              subtitle={localization.createNewSubtitle[language]}
            >
              <View
                className='bg-approve/10 flex flex-row items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  size={iconSize}
                  color={colors.approve}
                />
              </View>
            </ButtonListItem>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
