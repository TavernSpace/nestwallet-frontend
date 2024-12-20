import {
  faLaptopMobile,
  faMoneyBillTrendUp,
  faShieldCheck,
  faWallet,
} from '@fortawesome/pro-solid-svg-icons';
import { adjust } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { NestLight } from '../../../components/logo/nest';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from '../localization';

interface IntroInfoScreenProps {
  onContinue: VoidFunction;
}

export function IntroInfoScreen(props: IntroInfoScreenProps) {
  const { onContinue } = props;
  const { language } = useLanguageContext();

  return (
    <ViewWithInset
      className='flex h-full flex-col justify-between px-4'
      hasBottomInset={true}
    >
      <View className='flex flex-1 flex-col justify-between'>
        <View className='flex flex-col items-center justify-center space-y-2'>
          <View className='flex flex-row items-center justify-center space-x-3'>
            <NestLight size={adjust(40)} rounded={true} />
            <View className='flex flex-col items-center justify-center '>
              <Text className='text-primary text-2xl font-medium'>
                {localization.nestWallet[language]}
              </Text>
            </View>
          </View>
          <Text className='text-text-primary text-base font-medium'>
            {localization.walletWithZeroFees[language]}
          </Text>
        </View>

        <View className='w-full space-y-4'>
          <View className='flex flex-row items-center space-x-4'>
            <View className='bg-success/10 h-9 w-9 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faMoneyBillTrendUp}
                size={20}
                color={colors.success}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.tradeYourFavoriteTokens[language]}
              </Text>
            </View>
          </View>
          <View className='mt-4 flex flex-row items-center space-x-4'>
            <View className='bg-approve/10 h-9 w-9 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faShieldCheck}
                size={24}
                color={colors.approve}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.maximumSecurity[language]}
              </Text>
            </View>
          </View>
          <View className='mt-4 flex flex-row items-center space-x-4'>
            <View className='bg-primary/10 h-9 w-9 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faWallet}
                size={20}
                color={colors.primary}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.supportForSeed[language]}
              </Text>
            </View>
          </View>
          <View className='mt-4 flex flex-row items-center space-x-4'>
            <View className='bg-incognito/10 h-9 w-9 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faLaptopMobile}
                size={24}
                color={colors.incognito}
              />
            </View>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.seamlessSync[language]}
              </Text>
            </View>
          </View>
        </View>

        <View className='w-full'>
          <TextButton onPress={onContinue} text={localization.next[language]} />
        </View>
      </View>
    </ViewWithInset>
  );
}
