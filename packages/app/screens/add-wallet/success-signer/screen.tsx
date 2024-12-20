import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { IWalletType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function SuccessScreen(props: {
  walletType: IWalletType;
  onContinue: VoidFunction;
}) {
  const { onContinue } = props;
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
          {localization.success[language]}
        </Text>
        <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {localization.successDescription[language]}
          </Text>
        </View>
      </View>
      <View className='w-full'>
        <TextButton
          onPress={onContinue}
          text={localization.complete[language]}
        />
      </View>
    </ViewWithInset>
  );
}
