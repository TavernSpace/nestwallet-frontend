import ExecutingLottie from '@nestwallet/app/assets/animations/executing-lottie.json';
import LottieView from '../../../components/lottie-view';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { IWalletType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface ExecutionSheetLoadingContentProps {
  walletType?: IWalletType;
  children?: React.ReactNode;
}

export function ExecutionSheetLoadingContent(
  props: ExecutionSheetLoadingContentProps,
) {
  const { walletType, children } = props;
  const { language } = useLanguageContext();

  return (
    <View className='flex h-full flex-col px-4'>
      <View className='h-1/4' />
      <View className='flex flex-col items-center'>
        <View className='bg-primary/20 h-20 w-20 items-center justify-center rounded-full'>
          <LottieView
            animatedData={ExecutingLottie}
            autoplay={true}
            loop={true}
            height={144}
            width={144}
          />
        </View>
        <View className='flex flex-col items-center justify-center space-y-4 pt-6'>
          <Text className='text-text-primary text-lg font-medium'>
            {localization.executingTransaction[language]}
          </Text>
          <View className='bg-card flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-3'>
            <Text className='text-text-primary text-xs font-normal'>
              {walletType === IWalletType.Ledger
                ? localization.confirmOnLedger[language]
                : walletType === IWalletType.Trezor
                ? localization.confirmOnTrezor[language]
                : localization.signTransaction[language]}
            </Text>
            <Text className='text-text-secondary text-center text-xs font-normal'>
              {localization.doNotCloseScreen[language]}
            </Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}
