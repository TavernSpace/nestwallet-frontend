import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { useSetReferrerMutation } from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { ReferrerTakenScreen } from '@nestwallet/app/screens/settings/add-referrer/referrer-taken-state';
import { AddReferrerScreen } from '@nestwallet/app/screens/settings/add-referrer/screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { userService } from '../../../provider/constants';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'addReferrer'
>;

export const OnboardingAddReferrer = withUserContext(_OnboardingAddReferrer);

function _OnboardingAddReferrer({ route }: RouteProps) {
  const { referralCode } = route.params;
  const resetTo = useResetTo();
  const { user } = useUserContext();

  const setReferrerMutation = useMutationEmitter(
    graphqlType.User,
    useSetReferrerMutation(),
  );

  const handleNavigation = async () => {
    resetTo('app', {
      screen: 'walletDetails',
    });
  };

  const handleAddReferrer = async () => {
    await setReferrerMutation.mutateAsync({
      input: {
        referralCode,
      },
    });
    // we clear the referral code from local storage
    await userService.setReferralCode(null);
    await handleNavigation();
  };

  return user.referrer ? (
    <ReferrerTakenScreen user={user.referrer} onClose={handleNavigation} />
  ) : (
    <AddReferrerScreen
      referralCode={referralCode}
      onConfirm={handleAddReferrer}
      onSkip={handleNavigation}
    />
  );
}
