import { colors } from '@nestwallet/app/design/constants';
import { SplashContextProvider } from '@nestwallet/app/provider/splash';
import {
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBranch } from './src/hooks/branch';
import { useSentry } from './src/hooks/sentry';
import { AppNavigator } from './src/navigation/app-navigator';
import { AuthNavigator } from './src/navigation/auth-navigator';
import { OnboardingNavigator } from './src/navigation/onboarding-navigator';
import { Stack } from './src/navigation/types';
import { AppContextProvider } from './src/provider/application';
import { connectionService } from './src/provider/constants';
import './src/styles';

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    'http://localhost:19006',
    'https://nestwallet.xyz',
    'nestwallet://',
    'tc://',
  ],
  config: {
    screens: {
      app: {
        path: 'app',
        screens: {
          settings: {
            path: 'settings',
            screens: {
              addReferrer: 'referral/:referralCode',
            },
          },
          quest: {
            path: 'quest',
            screens: {
              questDetails: 'questDetails',
              connectOAuth: {
                path: 'connectOAuth',
              },
            },
          },
          wallet: {
            path: 'wallet',
            screens: {
              swap: 'swap',
            },
          },
          addWallet: {
            path: 'addWallet',
            screens: {
              importWalletAddSafe: 'importWalletAddSafe',
            },
          },
        },
      },
    },
  },
};

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

function App() {
  const navigationRef = useNavigationContainerRef();

  useSentry();
  useBranch(navigationRef);
  useEffect(() => {
    //TODO(Amir/Peter): Find a better way for this. May not be needed soon
    //Reset connected site. Allows browser's landing page to show on first open
    connectionService.setCurrentSite(undefined);
  }, []);

  return (
    <SplashContextProvider>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <SafeAreaProvider>
          <StatusBar
            barStyle={'light-content'}
            animated={true}
            backgroundColor={colors.background}
          />
          <AppContextProvider>
            <NavigationContainer
              linking={linking}
              theme={MyTheme}
              ref={navigationRef}
            >
              <Stack.Navigator initialRouteName='app'>
                <Stack.Screen
                  name='app'
                  component={AppNavigator}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name='auth'
                  component={AuthNavigator}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name='onboarding'
                  component={OnboardingNavigator}
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AppContextProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </SplashContextProvider>
  );
}

export default App;
