import { SnackbarContextProvider } from '@nestwallet/app/provider/snackbar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { getDefaultStackNavigationOptions } from '../common/header/utils';
import { AuthorizedUserContextProvider } from '../provider/user/auth';
import { OnboardingAddReferrer } from '../screens/onboarding/add-referrer';
import { OnboardingStack, RootStackParamList } from './types';

type RouteProps = NativeStackScreenProps<RootStackParamList, 'onboarding'>;

export function OnboardingNavigator({ route }: RouteProps) {
  return (
    <SnackbarContextProvider ignoreInset={Platform.OS === 'ios'}>
      <AuthorizedUserContextProvider main={false}>
        <OnboardingStack.Navigator>
          <OnboardingStack.Screen
            name='addReferrer'
            component={OnboardingAddReferrer}
            options={getDefaultStackNavigationOptions({
              title: 'Add Referral',
            })}
          />
        </OnboardingStack.Navigator>
      </AuthorizedUserContextProvider>
    </SnackbarContextProvider>
  );
}
