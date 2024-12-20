import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { adjust, withSize } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ActionSheet } from '../../../components/sheet';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface PasswordResetSheetProps {
  isShowing: boolean;
  loading?: boolean;
  onClose: VoidFunction;
  onSubmit: VoidFunction;
}

export function PasswordResetSheet(props: PasswordResetSheetProps) {
  const { isShowing, loading, onClose, onSubmit } = props;
  const { language } = useLanguageContext();

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        adornment={
          <View
            className='bg-failure/10 items-center justify-center rounded-full'
            style={withSize(adjust(24, 2))}
          >
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              size={adjust(14, 2)}
              color={colors.failure}
            />
          </View>
        }
        title={localization.resetPassword[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col items-center px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {localization.areYouSureMessage[language]}
          <Text className='text-failure font normal text-sm'>
            {localization.cannotBeUndone[language]}
          </Text>
        </Text>
        <View className='flex w-full flex-row space-x-4 pt-4'>
          <View className='flex-1'>
            <TextButton
              text={localization.cancel[language]}
              buttonColor={colors.failure}
              onPress={onClose}
              type='tertiary'
              disabled={loading}
            />
          </View>
          <View className='flex-1'>
            <TextButton
              text={localization.confirm[language]}
              buttonColor={colors.failure}
              onPress={onSubmit}
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </ActionSheet>
  );
}
