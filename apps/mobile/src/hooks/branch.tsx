import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useEffect } from 'react';
import branch from 'react-native-branch';
import { RootStackParamList } from '../navigation/types';
import { userService } from '../provider/constants';

export const useBranch = (
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
) => {
  useEffect(() => {
    branch.disableTracking(true);
    const unsubscribe = branch.subscribe(({ error, params }) => {
      if (error || !params) return;

      if (params['+clicked_branch_link'] && params.referral_code) {
        // (native linking) user just downloaded the app, just store in local storage
        if (params['+is_first_session']) {
          userService.setReferralCode(params.referral_code as string);
        }
        // (universal linking) user already has app, we navigate to the add referral screen
        else {
          navigationRef.navigate('app', {
            screen: 'settings',
            params: {
              screen: 'addReferrer',
              params: { referralCode: params.referral_code as string },
            },
          });
        }
      }
    });

    return () => unsubscribe();
  }, [navigationRef]);
};
