import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { empty } from '@nestwallet/app/common/utils/functions';
import { useAppContext } from '../../provider/application';

export function useLoginNavigate() {
  const { walletService } = useAppContext();
  const { userService } = useAppContext();
  const resetTo = useResetTo();

  const navigate = async () => {
    const [shouldSetup, referralCode] = await Promise.all([
      walletService.shouldSetup(),
      userService.getReferralCode(),
    ]);
    if (!shouldSetup.isSetup) {
      await walletService.setIsSetup();
    }
    if (shouldSetup.shouldShowNotificationPrompt) {
      await userService.requestNotificationPermission().catch(empty);
      await userService.setHasShownNotificationPrompted(true).catch(empty);
    }
    if (referralCode) {
      resetTo('onboarding', {
        screen: 'addReferrer',
        params: { referralCode: referralCode },
      });
    } else {
      resetTo('app', {
        screen: 'walletDetails',
      });
    }
  };

  return { navigate };
}
