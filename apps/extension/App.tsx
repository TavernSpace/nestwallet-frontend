import 'react-native-reanimated';
// eslint-disable-next-line
import 'setImmediate';
import './popup/styles';

import { NestLight } from '@nestwallet/app/components/logo/nest';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { NavigationTheme } from '@nestwallet/app/design/navigation/theme';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { WindowType } from '@nestwallet/app/provider/nestwallet';
import { PinBanner } from '@nestwallet/app/screens/intro/banner';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import cn from 'classnames';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { clearPersistedRouteState, useAppState } from './popup/hooks/app-state';
import { AppNavigator } from './popup/navigation/navigators/app-navigator';
import { ApprovalNavigator } from './popup/navigation/navigators/approval-navigator';
import { AuthNavigator } from './popup/navigation/navigators/auth-navigator';
import { IntroNavigator } from './popup/navigation/navigators/intro-navigator';
import { Stack } from './popup/navigation/types';
import { AppContextProvider } from './popup/provider/application';
import { ChooseProviderWithData } from './popup/screens/approval/choose-provider';

function App() {
  const appState = useAppState();
  const documentTitle = useMemo(() => ({ formatter: () => 'Nest Wallet' }), []);
  const navigationRef = useNavigationContainerRef();

  // TODO: if localStorage/chrome.storage is unavailable this can be stuck,
  // probably there is nothing better to do then just do nothing
  if (!appState.success) {
    return (
      <View
        className='bg-background'
        style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
      />
    );
  }

  const {
    windowType,
    initialRouteName,
    initialState,
    handleStateChange,
    refetchState,
    height,
    width,
  } = appState.data;

  const handleError = async () => {
    await clearPersistedRouteState();
    await refetchState(true);
  };

  const isIntro = document.URL.endsWith('?payload=&type=tab#/intro');

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {windowType === WindowType.tab && (
        <View className='fixed left-0 top-0 flex w-full flex-row items-start justify-between px-6 py-6'>
          <View className='flex flex-row items-center space-x-2'>
            <NestLight rounded={true} size={32} />
            <Text className='text-primary text-base font-medium'>
              {'Nest Wallet'}
            </Text>
          </View>
          {isIntro && (
            // TODO: pass in local language
            <PinBanner language={ILanguageCode.En} />
          )}
        </View>
      )}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className='flex flex-1 items-center justify-center'>
          <View className='relative text-base' style={{ width, height }}>
            <View
              className={cn('h-full w-full overflow-y-hidden', {
                'border-card-highlight rounded-3xl border':
                  windowType === WindowType.tab,
              })}
            >
              <AppContextProvider windowType={windowType} onError={handleError}>
                <NavigationContainer
                  onStateChange={handleStateChange}
                  initialState={initialState}
                  theme={NavigationTheme}
                  documentTitle={documentTitle}
                  ref={navigationRef}
                >
                  <Stack.Navigator initialRouteName={initialRouteName}>
                    <Stack.Screen
                      name='app'
                      component={AppNavigator}
                      options={{
                        animationEnabled: true,
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name='intro'
                      component={IntroNavigator}
                      options={{
                        animationEnabled: true,
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name='approval'
                      component={ApprovalNavigator}
                      options={{
                        animationEnabled: true,
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name='auth'
                      component={AuthNavigator}
                      options={{
                        animationEnabled: true,
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name='chooseProvider'
                      component={ChooseProviderWithData}
                      options={{
                        animationEnabled: true,
                        headerShown: false,
                      }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
              </AppContextProvider>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </View>
  );
}

export default App;
