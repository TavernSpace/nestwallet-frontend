import {
  faArrowUpRightFromSquare,
  faCheck,
  faCheckCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import LottieView from '../../../components/lottie-view';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface ExecutionSheetSuccessContentProps {
  successTitle: string;
  successSubtitle?: string;
  txHash?: string;
  onExplore?: VoidFunction;
  onDone: VoidFunction;
}

export function ExecutionSheetSuccessContent(
  props: ExecutionSheetSuccessContentProps,
) {
  const { successTitle, successSubtitle, txHash, onExplore, onDone } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex h-full flex-col px-4'>
      <View className='h-1/4' />
      <View className='flex flex-1 flex-col justify-between'>
        <View className='flex flex-col items-center justify-center'>
          <View className='flex flex-col items-center justify-center space-y-6'>
            <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faCheckCircle}
                size={48}
                color={colors.success}
              />
              <View className='absolute'>
                <LottieView
                  autoplay={true}
                  loop={false}
                  path='https://assets6.lottiefiles.com/packages/lf20_obhph3sh.json'
                  height={400}
                  width={400}
                />
              </View>
            </View>
            <View className='flex flex-col items-center justify-center space-y-4'>
              <Text className='text-text-primary text-lg font-medium'>
                {successTitle}
              </Text>
              <View className='bg-card flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-3'>
                <Text className='text-text-primary text-center text-xs font-normal'>
                  {localization.transactionSubmittedToBlockchain[language]}
                </Text>
                <Text className='text-text-secondary text-center text-xs font-normal'>
                  {successSubtitle
                    ? successSubtitle
                    : localization.waitAFewMinutes[language]}
                </Text>
              </View>
              {!!txHash && (
                <BaseButton className='rounded-xl' onPress={onExplore}>
                  <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                    <Text className='text-text-secondary text-sm font-medium'>
                      {localization.viewOnExplorer[language]}
                    </Text>
                    <FontAwesomeIcon
                      color={colors.textSecondary}
                      icon={faArrowUpRightFromSquare}
                      size={adjust(14, 2)}
                    />
                  </View>
                </BaseButton>
              )}
            </View>
          </View>
        </View>
        <TextButton text={localization.done[language]} onPress={onDone} />
      </View>
    </View>
  );
}

export function ExecutionSuccessContentStatic(
  props: ExecutionSheetSuccessContentProps,
) {
  const { successTitle, successSubtitle, txHash, onExplore, onDone } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex flex-col px-4'>
      <View className='flex flex-col items-center justify-center space-y-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faCheck} color={colors.success} size={48} />
        </View>
        <View className='flex flex-col items-center justify-center space-y-4'>
          <View className='flex flex-col items-center justify-center'>
            <Text className='text-text-primary text-lg font-medium'>
              {successTitle}
            </Text>
            <Text className='text-text-secondary mt-2 text-center text-sm'>
              {localization.transactionSubmittedToBlockchain[language]}
            </Text>
          </View>
          {!!txHash && (
            <BaseButton onPress={onExplore}>
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Text className='text-text-primary text-sm font-medium'>
                  {localization.viewOnExplorer[language]}
                </Text>
                <FontAwesomeIcon
                  color={colors.textPrimary}
                  icon={faArrowUpRightFromSquare}
                  size={adjust(14, 2)}
                />
              </View>
            </BaseButton>
          )}
        </View>
      </View>
      <View className='flex flex-col space-y-2 pt-4'>
        <View className='bg-card rounded-2xl px-4 py-3'>
          <Text className='text-text-secondary text-xs font-normal'>
            {successSubtitle
              ? successSubtitle
              : localization.waitAFewMinutes[language]}
          </Text>
        </View>
        <TextButton text={localization.done[language]} onPress={onDone} />
      </View>
    </View>
  );
}
